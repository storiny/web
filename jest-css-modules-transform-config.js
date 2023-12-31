/* eslint-disable prefer-snakecase/prefer-snakecase */

const path = require("node:path");
const additional_resolve_path = path.resolve(
  __dirname,
  "packages",
  "ui",
  "src",
  "theme",
);

module.exports = {
  sassConfig: {
    includePaths: [additional_resolve_path],
  },
};
