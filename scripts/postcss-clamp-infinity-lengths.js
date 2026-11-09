/**
 * Tailwind v4 emits `calc(infinity * 1px)` for the `*-full` radius utilities,
 * which resolves to `border-radius: 3.40282e38px` (f32::MAX). lightningcss's
 * JS visitor deserializer fails on values in that range on native
 * ("expected a 32-bit floating point, found i64::MAX") and the whole bundle
 * dies. Clamping those lengths to 9999px right after Tailwind runs keeps the
 * visual effect (fully rounded) and keeps the bundle compiling.
 */
module.exports = () => ({
  postcssPlugin: "clamp-infinity-lengths",
  Declaration(decl) {
    if (decl.value && decl.value.includes("infinity")) {
      decl.value = decl.value.replace(
        /calc\(\s*infinity\s*\*\s*1px\s*\)/g,
        "9999px",
      );
    }
    if (decl.value && /3\.40282e38px/i.test(decl.value)) {
      decl.value = decl.value.replace(/3\.40282e38px/gi, "9999px");
    }
  },
});
module.exports.postcss = true;
