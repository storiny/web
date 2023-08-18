// noinspection JSUnusedGlobalSymbols

import { mockStories } from "@storiny/ui/src/mocks";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import DashboardLayout from "../../../../../layout";
import DashboardSplashLayout from "../../../layout";
import DefaultDashboardLeftSidebarLayout from "../../layout";
import ContentStoriesPage from "./client";

const meta: Meta<typeof ContentStoriesPage> = {
  title: "dashboard/Content/stories",
  component: ContentStoriesPage,
  args: {
    deleted_stories_count: 5,
    published_stories_count: 5
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof ContentStoriesPage>;

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
