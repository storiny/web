// noinspection JSUnusedGlobalSymbols

import { MOCK_STORIES } from "@storiny/ui/src/mocks";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../../../layout";
import DashboardSplashLayout from "../../../../../layout";
import DefaultDashboardLeftSidebarLayout from "../../../../layout";
import ContentStoryStatsPage from "./client";

const meta: Meta<typeof ContentStoryStatsPage> = {
  title: "dashboard/content/stories/stats",
  component: ContentStoryStatsPage,
  args: {
    story_id: MOCK_STORIES[0].id
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof ContentStoryStatsPage>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DashboardLayout>
          <DashboardSplashLayout>
            <DefaultDashboardLeftSidebarLayout>
              <Story />
            </DefaultDashboardLeftSidebarLayout>
          </DashboardSplashLayout>
        </DashboardLayout>,
        { ignore_primitive_providers: false, logged_in: true }
      )
  ]
};
