// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import DefaultLayout from "../../layout";
import DefaultRightSidebarLayout from "../layout";
import LikedStories from "./page";

const meta: Meta<typeof LikedStories> = {
  title: "pages/LikedStories",
  component: LikedStories,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof LikedStories>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <DefaultLayout>
          <DefaultRightSidebarLayout>
            <Story />
          </DefaultRightSidebarLayout>
        </DefaultLayout>,
        { ignorePrimitiveProviders: true, loggedIn: true }
      )
  ]
};
