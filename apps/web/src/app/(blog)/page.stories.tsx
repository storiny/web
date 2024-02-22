// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import BlogLayout from "./layout";
import Blog from "./page";

const meta: Meta<typeof Blog> = {
  title: "pages/blog",
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
        <BlogLayout>
          <Story />
        </BlogLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};
