/* eslint-disable prefer-snakecase/prefer-snakecase */

import type { Config } from "jest";

const config: Config = {
  displayName: "cdn",
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)s$": "@swc/jest"
  },
  transformIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/e2e/"],
  verbose: true
};

export default config;
