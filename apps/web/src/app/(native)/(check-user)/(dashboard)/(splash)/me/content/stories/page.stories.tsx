// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../layout";
import DashboardSplashLayout from "../../../layout";
import DashboardLeftSidebarLayout from "../../layout";
import ContentStoriesPage from "./client";

const meta: Meta<typeof ContentStoriesPage> = {
  title: "dashboard/content/stories",
  component: ContentStoriesPage,
  args: {
    deleted_story_count: 5,
    published_story_count: 5
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
