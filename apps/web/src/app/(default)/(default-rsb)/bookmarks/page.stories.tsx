// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DefaultLayout from "../../layout";
import DefaultRightSidebarLayout from "../layout";
import Bookmarks from "./page";

const meta: Meta<typeof Bookmarks> = {
  title: "pages/Bookmarks",
  component: Bookmarks,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Bookmarks>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DefaultLayout>
          <DefaultRightSidebarLayout>
            <Story />
          </DefaultRightSidebarLayout>
        </DefaultLayout>,
        { ignore_primitive_providers: true, logged_in: true }
      )
  ]
};
