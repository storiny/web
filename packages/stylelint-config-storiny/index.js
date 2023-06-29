module.exports = {
  extends: ["stylelint-config-standard-scss", "stylelint-config-prettier-scss"],
  rules: {
    "color-named": "never",
    "function-disallowed-list": ["rgb", "hwb", "lch"],
  },
  reportDescriptionlessDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,
};
