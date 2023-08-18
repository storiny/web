// noinspection JSUnusedGlobalSymbols

import { mockStories } from "@storiny/ui/src/mocks";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import DashboardLayout from "../../../../../layout";
import DashboardSplashLayout from "../../../layout";
import DefaultDashboardLeftSidebarLayout from "../../layout";
import ContentDraftsPage from "./client";

const meta: Meta<typeof ContentDraftsPage> = {
  title: "dashboard/Content/drafts",
  component: ContentDraftsPage,
  args: {
    deleted_drafts_count: 5,
    pending_drafts_count: 5,
    latest_draft: {
      ...mockStories[0],
      edited_at: mockStories[0].edited_at || undefined,
      published_at: mockStories[0].published_at || undefined,
      splash_hex: mockStories[0].splash_hex || undefined,
      splash_id: mockStories[0].splash_id || undefined
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
