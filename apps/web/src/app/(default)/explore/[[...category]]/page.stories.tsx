// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import DefaultLayout from "../../layout";
import Explore from "./page";

const meta: Meta<typeof Explore> = {
  title: "pages/Explore",
  component: Explore,
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
          <Story />
        </DefaultLayout>,
        { ignorePrimitiveProviders: true }
      )
  ]
};
