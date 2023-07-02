// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import DefaultLayout from "../layout";
import DefaultRightSidebarLayout from "./layout";
import Index from "./page";

const meta: Meta<typeof Index> = {
  title: "pages/Index",
  component: Index,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Index>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <DefaultLayout>
          <DefaultRightSidebarLayout>
            <Story />
          </DefaultRightSidebarLayout>
        </DefaultLayout>,
        { ignorePrimitiveProviders: true }
      )
  ]
};

export const LoggedIn: Story = {
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <DefaultLayout>
          <DefaultRightSidebarLayout>
            <Story />
          </DefaultRightSidebarLayout>
        </DefaultLayout>,
        { loggedIn: true, ignorePrimitiveProviders: true }
      )
  ]
};
