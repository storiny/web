// @ts-check

import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { uglify } from "rollup-plugin-uglify";
import { nodeResolve } from "@rollup/plugin-node-resolve";

// List of njs built-in modules.
const njsExternals = ["crypto", "fs", "querystring", "xml", "zlib"];

/**
 * @type {import('rollup').RollupOptions}
 */
const options = {
  input: "src/index.ts",
  external: njsExternals,
  plugins: [
    // Transpile TypeScript sources to JS.
    babel({
      babelHelpers: "bundled",
      envName: "njs",
      extensions: [".ts", ".mjs", ".js"],
    }),
    // Resolve node modules.
    nodeResolve({
      extensions: [".mjs", ".js", ".json", ".ts"],
    }),
    // Convert CommonJS modules to ES6 modules.
    commonjs(),
    // Cleanup output
    uglify({
      mangle: false,
      sourcemap: false,
    }),
  ],
  output: {
    file: "nginx/njs-files/index.js",
    format: "es",
  },
};

export default options;
