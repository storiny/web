/* eslint-disable @typescript-eslint/explicit-function-return-type */

"use strict";

// @ts-check

/** @type {babel.ConfigFunction} */
module.exports = (api) => ({
  presets: [
    // Transpile modern JavaScript into code compatible with njs.
    // This is used only for building the dist bundle with Rollup.
    ...(api.env("njs") ? ["babel-preset-njs"] : []),
    // Parse TypeScript syntax and transform it to JavaScript (i.e. it strips
    // type annotations, but does not perform type checking).
    [
      "@babel/preset-typescript",
      {
        allowDeclareFields: true,
      },
    ],
  ],
});
