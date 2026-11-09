// postcss.config.js

/**
 * The clamp plugin lives in scripts/postcss-clamp-infinity-lengths.js — see
 * that file for why. It must run after @tailwindcss/postcss.
 */
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
    "./scripts/postcss-clamp-infinity-lengths.js": {},
  },
};
