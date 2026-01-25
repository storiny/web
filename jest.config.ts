import type { Config } from "jest";

const config: Config = {
  projects: [
    {
      displayName: "web",
      setupFilesAfterEnv: [`<rootDir>/apps/web/jest.setup.ts`],
      testEnvironment: "jsdom",
      transform: {
        "^.+\\.(t|j)sx?$": "@swc/jest",
        ".+\\.(css|styl|less|sass|scss)$": "jest-css-modules-transform",
      },
      testMatch: [
        "<rootDir>/apps/web/**/*.test.ts",
        "<rootDir>/apps/web/**/*.test.tsx",
      ],
      modulePathIgnorePatterns: ["<rootDir>/.vercel/"],
      moduleNameMapper: {
        // Typescript absolute paths
        "~/common/(.*)": `<rootDir>/apps/web/src/common/$1`,
        "~/(.*)": `<rootDir>/packages/ui/src/$1`,
      },
    },
    {
      displayName: "editor",
      setupFilesAfterEnv: [`<rootDir>/packages/editor/jest.setup.ts`],
      testEnvironment: "jsdom",
      transform: {
        "^.+\\.(t|j)sx?$": "@swc/jest",
        ".+\\.(css|styl|less|sass|scss)$": "jest-css-modules-transform",
      },
      testMatch: [
        "<rootDir>/packages/editor/**/*.test.ts",
        "<rootDir>/packages/editor/**/*.test.tsx",
      ],
      transformIgnorePatterns: ["/node_modules/(?!color-name)"],
      modulePathIgnorePatterns: ["<rootDir>/.vercel/"],
      moduleNameMapper: {
        // Typescript absolute paths
        "~/common/(.*)": `<rootDir>/apps/web/src/common/$1`,
        "~/(.*)": `<rootDir>/packages/ui/src/$1`,
      },
    },
    {
      displayName: "ui",
      setupFilesAfterEnv: [`<rootDir>/packages/ui/jest.setup.ts`],
      testEnvironment: "jsdom",
      transform: {
        "^.+\\.(t|j)sx?$": "@swc/jest",
        ".+\\.(css|styl|less|sass|scss)$": "jest-css-modules-transform",
      },
      testMatch: [
        "<rootDir>/packages/ui/**/*.test.ts",
        "<rootDir>/packages/ui/**/*.test.tsx",
      ],
      modulePathIgnorePatterns: ["<rootDir>/.vercel/"],
      moduleNameMapper: {
        // Typescript absolute paths
        "~/common/(.*)": `<rootDir>/apps/web/src/common/$1`,
        "~/(.*)": `<rootDir>/packages/ui/src/$1`,
      },
    },
  ],
  transformIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/e2e/"],
  verbose: true,
};

export default config;
