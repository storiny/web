// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

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
      renderWithState(
        <DefaultLayout>
          <ExploreLayout>
            <Story />
          </ExploreLayout>
        </DefaultLayout>,
        { ignorePrimitiveProviders: true }
      )
  ]
};
