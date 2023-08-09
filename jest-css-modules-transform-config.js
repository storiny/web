const path = require("path");
const additionalResolvePath = path.resolve(
  __dirname,
  "packages",
  "ui",
  "src",
  "theme"
);

module.exports = {
  sassConfig: {
    includePaths: [additionalResolvePath],
  },
};
