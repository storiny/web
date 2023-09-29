// noinspection JSUnusedGlobalSymbols

import { MOCK_STORIES } from "@storiny/ui/src/mocks";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../layout";
import DashboardSplashLayout from "../../../layout";
import DefaultDashboardLeftSidebarLayout from "../../layout";
import ContentDraftsPage from "./client";

const meta: Meta<typeof ContentDraftsPage> = {
  title: "dashboard/Content/drafts",
  component: ContentDraftsPage,
  args: {
    deleted_draft_count: 5,
    pending_draft_count: 5,
    latest_draft: {
      ...MOCK_STORIES[0],
      edited_at: MOCK_STORIES[0].edited_at || undefined,
      published_at: MOCK_STORIES[0].published_at || undefined,
      splash_hex: MOCK_STORIES[0].splash_hex || undefined,
      splash_id: MOCK_STORIES[0].splash_id || undefined
    }
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof ContentDraftsPage>;

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
