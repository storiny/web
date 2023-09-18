// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import { clsx } from "clsx";
import React from "react";

import { renderWithState } from "~/redux/mock";

import Editor from "./editor";

const meta: Meta<typeof Editor> = {
  title: "packages/Editor",
  component: Editor,
  parameters: {
    layout: "fullscreen"
  },
  args: {
    docId: "demo",
    role: "editor"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Editor>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <div
          className={clsx("grid", "grid-container", "dashboard", "no-sidenav")}
        >
          <Story />
        </div>,
        { ignorePrimitiveProviders: false, loggedIn: true }
      )
  ]
};
