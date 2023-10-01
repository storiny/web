import * as React from "react";
import { types, addons } from "@storybook/addons";
import ToggleTheme from "./components/toggle-theme";

addons.register("storybook-theme-toggle", () => {
  addons.add("storybook-theme-toggle", {
    title: "Toggle theme",
    type: types.TOOL,
    match: ({ viewMode }) => !!(viewMode && viewMode.match(/^(story|docs)$/)),
    render: () => <ToggleTheme />,
  });
});
