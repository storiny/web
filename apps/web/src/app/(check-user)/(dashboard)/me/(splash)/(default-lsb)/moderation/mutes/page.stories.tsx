// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import DashboardLayout from "../../../../../layout";
import DashboardSplashLayout from "../../../layout";
import DefaultDashboardLeftSidebarLayout from "../../layout";
import ModerationMutesPage from "./client";

const meta: Meta<typeof ModerationMutesPage> = {
  title: "dashboard/Moderation/mutes",
  component: ModerationMutesPage,
  args: {
    mute_count: 5
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof ModerationMutesPage>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <DashboardLayout>
          <DashboardSplashLayout>
            <DefaultDashboardLeftSidebarLayout>
              <Story />
            </DefaultDashboardLeftSidebarLayout>
          </DashboardSplashLayout>
        </DashboardLayout>,
        { ignorePrimitiveProviders: false, loggedIn: true }
      )
  ]
};
