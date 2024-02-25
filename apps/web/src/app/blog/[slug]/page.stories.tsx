// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import StorybookBlogLayout from "./layout.storybook";
import Blog from "./page";

const meta: Meta<typeof Blog> = {
  title: "pages/blog/index",
  component: Blog,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Blog>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <StorybookBlogLayout>
          <Story />
        </StorybookBlogLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};
