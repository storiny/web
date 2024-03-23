// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import StorybookBlogLayout from "../../layout.storybook";
import DefaultBlogLayout from "../layout";
import BlogEditorsLayout from "./layout";
import Editors from "./page";

const meta: Meta<typeof Editors> = {
  title: "pages/blog/editors",
  component: Editors,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Editors>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <StorybookBlogLayout>
          <DefaultBlogLayout>
            <BlogEditorsLayout>
              <Story />
            </BlogEditorsLayout>
          </DefaultBlogLayout>
        </StorybookBlogLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};
