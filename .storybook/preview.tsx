import "../packages/ui/src/theme/main.scss";
import "../packages/ui/src/theme/storybook.scss";
import { Preview } from "@storybook/react";
import AppStateProvider from "../packages/ui/src/redux/components/root-provider";
// noinspection ES6PreferShortImport
import { store } from "../packages/ui/src/redux/store";
import * as React from "react";
import { setupWorker as setup_worker, rest } from "msw";
import { register_api_endpoints } from "./api";

const preview: Preview = {
  decorators: [
    (Story) => (
      <AppStateProvider store={store}>
        <Story />
      </AppStateProvider>
    ),
  ],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
    html: {
      prettier: {
        tabWidth: 2,
        useTabs: false,
        htmlWhitespaceSensitivity: "strict",
      },
    },
    backgrounds: {
      default: "Body",
      values: [
        { name: "Body", value: "var(--bg-body)" },
        { name: "Elevation XS", value: "var(--bg-elevation-xs)" },
        { name: "Elevation SM", value: "var(--bg-elevation-sm)" },
        { name: "Elevation MD", value: "var(--bg-elevation-md)" },
        { name: "Elevation LG", value: "var(--bg-elevation-lg)" },
      ],
    },
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        date: /Date$/,
      },
    },
  },
};

// Storybook executes this module in both bootstrap phase (Node)
// and story's runtime (browser). However, we cannot call `setupWorker`
// in Node environment, so we need to check if we're in the browser.
if (typeof global.process === "undefined") {
  const worker = setup_worker();
  worker.start().then(() => undefined);
  // Expose worker globally
  window.msw = { worker, rest };
  // Register global endpoints
  register_api_endpoints().then(() => undefined);
}

export default preview;
