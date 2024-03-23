// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../layout";
import DashboardSplashLayout from "../../../../layout";
import StorybookBlogDashboardLayout from "../../layout.storybook";
import StoriesStatsPage from "./client";

const meta: Meta<typeof StoriesStatsPage> = {
  title: "blog-dashboard/stats/stories",
  component: StoriesStatsPage,
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DashboardLayout>
          <DashboardSplashLayout>
            <StorybookBlogDashboardLayout blog={{ has_plus_features: true }}>
              <Story />
            </StorybookBlogDashboardLayout>
          </DashboardSplashLayout>
        </DashboardLayout>,
        { ignore_primitive_providers: false, logged_in: true }
      )
  ],
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof StoriesStatsPage>;

export const Default: Story = {};
