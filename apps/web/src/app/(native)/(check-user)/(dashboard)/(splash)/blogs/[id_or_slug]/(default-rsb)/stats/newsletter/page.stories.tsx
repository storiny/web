// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../../layout";
import DashboardSplashLayout from "../../../../../layout";
import StorybookBlogDashboardLayout from "../../../layout.storybook";
import DefaultBlogDashboardRightSidebarLayout from "../../layout";
import NewsletterStatsPage from "./client";

const meta: Meta<typeof NewsletterStatsPage> = {
  title: "blog-dashboard/stats/newsletter",
  component: NewsletterStatsPage,
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DashboardLayout>
          <DashboardSplashLayout>
            <StorybookBlogDashboardLayout>
              <DefaultBlogDashboardRightSidebarLayout>
                <Story />
              </DefaultBlogDashboardRightSidebarLayout>
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
type Story = StoryObj<typeof NewsletterStatsPage>;

export const Default: Story = {};
