/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  extends: [
    "next",
    "turbo",
    "prettier",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:jest-dom/recommended",
  ],
  env: {
    "jest/globals": true,
    es2020: true,
  },
  globals: { NodeJS: true },
  overrides: [
    {
      extends: [
        // TODO: Currently throws `TypeError: Cannot read properties of undefined (reading 'getTokens')`
        // "plugin:@typescript-eslint/recommended",
        "plugin:typescript-sort-keys/recommended",
      ],
      files: ["*.{ts,tsx}"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint", "typescript-sort-keys"],
      rules: {
        "@typescript-eslint/no-unused-vars": "error",
        "@typescript-eslint/explicit-function-return-type": "error",
      },
    },
  ],
  plugins: [
    "jest",
    "prefer-arrow-functions",
    "simple-import-sort",
    "sort-class-members",
  ],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "no-unused-vars": "off",
    "prefer-arrow-callback": "warn",
    "prefer-arrow-functions/prefer-arrow-functions": [
      "warn",
      {
        classPropertiesAllowed: false,
        disallowPrototype: false,
        returnStyle: "implicit",
        singleReturnOnly: false,
      },
    ],
    "react/jsx-sort-props": "warn",
    "react/prop-types": "off",
    "simple-import-sort/exports": "error",
    "simple-import-sort/imports": "error",
    "turbo/no-undeclared-env-vars": "off",
    "sort-class-members/sort-class-members": [
      2,
      {
        order: [
          "constructor",
          "[static-properties]",
          "[static-methods]",
          "[properties]",
          "[conventional-private-properties]",
          "[methods]",
          "[conventional-private-methods]",
        ],
        accessorPairPositioning: "getThenSet",
      },
    ],
  },
};
