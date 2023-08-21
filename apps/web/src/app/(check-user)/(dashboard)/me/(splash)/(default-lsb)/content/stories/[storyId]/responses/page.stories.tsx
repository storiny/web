// noinspection JSUnusedGlobalSymbols

import { mockStories } from "@storiny/ui/src/mocks";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import DashboardLayout from "../../../../../../../layout";
import DashboardSplashLayout from "../../../../../layout";
import DefaultDashboardLeftSidebarLayout from "../../../../layout";
import ContentStoryResponsesPage from "./client";

const meta: Meta<typeof ContentStoryResponsesPage> = {
  title: "dashboard/Content/stories/responses",
  component: ContentStoryResponsesPage,
  args: {
    total_count: 5,
    hidden_count: 5,
    storyId: mockStories[0].id
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof ContentStoryResponsesPage>;

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
