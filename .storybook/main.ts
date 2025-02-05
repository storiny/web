import { StorybookConfig } from "@storybook/nextjs";
import * as path from "path";

const config: StorybookConfig = {
  stories: [
    "../apps/web/src/**/*.stories.mdx",
    "../packages/ui/src/**/*.stories.mdx",
    "../packages/editor/src/**/*.stories.mdx",
    "../packages/whiteboard/src/**/*.stories.mdx",
    "../apps/web/src/**/*.stories.@(js|jsx|ts|tsx)",
    "../packages/ui/src/**/*.stories.@(js|jsx|ts|tsx)",
    "../packages/editor/src/**/*.stories.@(js|jsx|ts|tsx)",
    "../packages/whiteboard/src/**/*.stories.@(js|jsx|ts|tsx)",
  ],
  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-essentials"),
    getAbsolutePath("@storybook/addon-interactions"),
    getAbsolutePath("@storybook/addon-a11y"),
    getAbsolutePath("@storybook/addon-storysource"),
    {
      name: "@storybook/addon-styling",
      options: {
        sass: {
          implementation: require("sass"),
          includePaths: [path.join(__dirname, "../packages/ui/src/theme")],
        },
      },
    },
    "./addons/theme",
  ],
  webpackFinal: async (config) => {
    config.resolve!.alias = {
      ...config.resolve!.alias,
      // Typescript absolute paths
      // @storiny/web
      "~/common": path.resolve(__dirname, "../apps/web/src/common"),
      // @storiny/ui
      "~/redux": path.resolve(__dirname, "../packages/ui/src/redux"),
      "~/brand": path.resolve(__dirname, "../packages/ui/src/brand"),
      "~/utils": path.resolve(__dirname, "../packages/ui/src/utils"),
      "~/hooks": path.resolve(__dirname, "../packages/ui/src/hooks"),
      "~/theme": path.resolve(__dirname, "../packages/ui/src/theme"),
      "~/icons": path.resolve(__dirname, "../packages/ui/src/icons"),
      "~/layout": path.resolve(__dirname, "../packages/ui/src/layout"),
      "~/components": path.resolve(__dirname, "../packages/ui/src/components"),
      "~/illustrations": path.resolve(
        __dirname,
        "../packages/ui/src/illustrations",
      ),
      "~/entities": path.resolve(__dirname, "../packages/ui/src/entities"),
      "~/types": path.resolve(__dirname, "../packages/ui/src/types"),
    };

    return config;
  },
  core: {
    disableTelemetry: true,
  },
  staticDirs: ["./public"],
  framework: "@storybook/nextjs",
  docs: {
    autodocs: "tag",
  },
};

export default config;

function getAbsolutePath(value: string): any {
  return path.dirname(require.resolve(path.join(value, "package.json")));
}
