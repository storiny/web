// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DefaultLayout from "../../layout";
import ExploreLayout from "../layout";
import Explore from "./client";

const meta: Meta<typeof Explore> = {
  title: "pages/Explore",
  component: Explore,
  args: { category: "all" },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Explore>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DefaultLayout>
          <ExploreLayout>
            <Story />
          </ExploreLayout>
        </DefaultLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};
