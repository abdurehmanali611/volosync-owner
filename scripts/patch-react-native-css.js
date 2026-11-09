/**
 * Patches react-native-css's compiler so visitor handlers never hand `null`
 * fields back to lightningcss.
 *
 * Root cause of "failed to deserialize; expected an object-like struct named
 * Specifier, found ()" during Android/iOS bundling: lightningcss's parser
 * emits null fields on parsed nodes (`"from": null`, `"fallback": null`, …),
 * but the napi deserializer used for the JS→Rust visitor round-trip rejects
 * null values (it reads them as a unit `()` where a struct/sequence is
 * expected). Any rule containing `var(...)`, `env(...)`, etc. then fails the
 * second a visitor returns the parsed node — including react-native-css's own
 * first pass, and even Expo's bundled LogToast.module.css.
 *
 * The wrapper strips null/undefined fields from every object a handler
 * returns before it crosses back into Rust. Idempotent: safe on every
 * install (EAS runs `npm install`, then this `postinstall`, then the build).
 *
 * If react-native-css ships an upstream fix, this patch stops applying and
 * the script exits quietly — delete it once the pinned range no longer needs
 * it.
 */

const fs = require("node:fs");
const path = require("node:path");

const target = path.join(
  __dirname,
  "..",
  "node_modules",
  "react-native-css",
  "dist",
  "commonjs",
  "compiler",
  "compiler.js",
);

const MARKER = "__volosyncNullStripPatch";

const ORIGINAL = `  const {
    lightningcss,
    Features
  } = (0, _lightningcssLoader.lightningcssLoader)();`;

const PATCHED = `  const {
    lightningcss: __lightningcssRaw,
    Features
  } = (0, _lightningcssLoader.lightningcssLoader)();
  // ${MARKER}: lightningcss's parser emits null fields ("from": null,
  // "fallback": null, ...) but the napi deserializer used for visitor
  // round-trips rejects null values ("expected an object-like struct named
  // Specifier, found ()"). Strip null fields from every node a visitor
  // handler returns before it crosses back into Rust.
  const F32_MAX = 3.4028234663852886e38;
  const __stripNulls = (node) => {
    if (typeof node === "number") {
      // Clamp to f32 range: lightningcss stores lengths as f32, and values
      // like Tailwind's 3.40282e38px scaled by the rem multiplier overflow
      // it, which crashes the napi deserializer ("found i64::MAX").
      if (!Number.isFinite(node)) return node;
      if (node > F32_MAX) return F32_MAX;
      if (node < -F32_MAX) return -F32_MAX;
      return node;
    }
    if (Array.isArray(node)) {
      return node
        .filter((item) => item !== null && item !== undefined)
        .map((item) => __stripNulls(item));
    }
    if (node && typeof node === "object") {
      const out = {};
      for (const key of Object.keys(node)) {
        const value = node[key];
        if (value === null || value === undefined) continue;
        out[key] = __stripNulls(value);
      }
      return out;
    }
    return node;
  };
  const lightningcss = (options) => {
    if (
      options &&
      typeof options === "object" &&
      options.visitor &&
      typeof options.visitor === "object"
    ) {
      const wrapped = {};
      for (const [key, handler] of Object.entries(options.visitor)) {
        if (typeof handler !== "function") {
          wrapped[key] = handler;
          continue;
        }
        wrapped[key] = (...args) => {
          const result = handler(...args);
          return result && typeof result === "object"
            ? __stripNulls(result)
            : result;
        };
      }
      return __lightningcssRaw({ ...options, visitor: wrapped });
    }
    return __lightningcssRaw(options);
  };`;

function main() {
  if (!fs.existsSync(target)) {
    console.log(
      "[patch-react-native-css] react-native-css is not installed — nothing to patch.",
    );
    return;
  }
  const source = fs.readFileSync(target, "utf8");
  if (source.includes(MARKER)) {
    console.log("[patch-react-native-css] already applied.");
    return;
  }
  if (!source.includes(ORIGINAL)) {
    console.warn(
      "[patch-react-native-css] expected code not found — react-native-css may have been fixed upstream. Skipping.",
    );
    return;
  }
  fs.writeFileSync(target, source.replace(ORIGINAL, PATCHED));
  console.log("[patch-react-native-css] applied null-strip visitor patch.");
}

main();
