// noinspection JSUnusedGlobalSymbols

import { MOCK_STORIES } from "@storiny/ui/src/mocks";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../../layout";
import DashboardSplashLayout from "../../../../../layout";
import DashboardLeftSidebarLayout from "../../../../layout";
import ContentStoryResponsesPage from "./client";

const meta: Meta<typeof ContentStoryResponsesPage> = {
  title: "dashboard/content/stories/responses",
  component: ContentStoryResponsesPage,
  args: {
    total_count: 5,
    hidden_count: 5,
    story_id: MOCK_STORIES[0].id
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
      render_with_state(
        <DashboardLayout>
          <DashboardSplashLayout>
            <DashboardLeftSidebarLayout>
              <Story />
            </DashboardLeftSidebarLayout>
          </DashboardSplashLayout>
        </DashboardLayout>,
        { ignore_primitive_providers: false, logged_in: true }
      )
  ]
};
