// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../../../../layout";
import DashboardSplashLayout from "../../../../../../layout";
import DefaultDashboardLeftSidebarLayout from "../../../../../layout";
import DefaultDashboardRightSidebarLayout from "../../../../layout";
import ContentStoryMetricsPage from "./client";

const meta: Meta<typeof ContentStoryMetricsPage> = {
  title: "dashboard/Content/stories/metrics",
  component: ContentStoryMetricsPage,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof ContentStoryMetricsPage>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DashboardLayout>
          <DashboardSplashLayout>
            <DefaultDashboardLeftSidebarLayout>
              <DefaultDashboardRightSidebarLayout>
                <Story />
              </DefaultDashboardRightSidebarLayout>
            </DefaultDashboardLeftSidebarLayout>
          </DashboardSplashLayout>
        </DashboardLayout>,
        { ignore_primitive_providers: false, logged_in: true }
      )
  ]
};
