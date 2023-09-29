/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  extends: [
    "next",
    "turbo",
    "prettier",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:jest-dom/recommended",
    "plugin:prefer-snakecase/recommended",
  ],
  env: {
    "jest/globals": true,
    es2020: true,
  },
  globals: { NodeJS: true },
  overrides: [
    {
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:typescript-sort-keys/recommended",
      ],
      files: ["*.{ts,tsx}"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint", "typescript-sort-keys"],
      rules: {
        "@typescript-eslint/no-unused-vars": "error",
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
      },
    },
  ],
  plugins: [
    "jest",
    "prefer-arrow-functions",
    "prefer-snakecase",
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
    "prefer-snakecase/prefer-snakecase": [
      "error",
      "always",
      {
        allowPascalCase: true,
        allowDestructuringPattern: true,
        whitelist: [
          "serializeQueryArgs", // Redux
          "endpointName",
          "queryArgs",
          "transformResponse",
          "forceRefetch",
          "currentArg",
          "previousArg",
          "invalidatesTags",
          "providesTags",
          "onQueryStarted",
          "queryFulfilled",
          "initialState",
          "actionCreator",
          "extraReducers",
          "argTypes",
          "delayMs", // Radix avatar fallback
          "defaultValue", // Storybook
          "defaultValues", // react-hook-form
          "fieldState",
          "baseElement", // RTL
          "queryByTestId",
          "queryAllByTestId",
          "queryByRole",
          "getByLabelText",
          "getByTestId",
          "getAllByTestId",
          "getByRole",
          "componentDidMount", // React
          "componentDidUpdate",
          "componentWillUnmount",
          "defaultProps",
          "getDerivedStateFromProps",
          "zIndex",
        ],
      },
    ],
    "react/jsx-sort-props": "warn",
    "react/prop-types": "off",
    "simple-import-sort/exports": "error",
    "simple-import-sort/imports": "error",
    "turbo/no-undeclared-env-vars": "off",
    "sort-class-members/sort-class-members": [
      "error",
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
    "capitalized-comments": [
      "error",
      "always",
      { ignorePattern: "pragma|noinspection" },
    ],
  },
};
