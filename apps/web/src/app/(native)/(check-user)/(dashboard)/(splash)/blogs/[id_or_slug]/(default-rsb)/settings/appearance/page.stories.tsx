// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../../layout";
import DashboardSplashLayout from "../../../../../layout";
import StorybookBlogDashboardLayout from "../../../layout.storybook";
import DefaultBlogDashboardRightSidebarLayout from "../../layout";
import BlogAppearanceSettingsPage from "./client";

const meta: Meta<typeof BlogAppearanceSettingsPage> = {
  title: "blog-dashboard/settings/appearance",
  component: BlogAppearanceSettingsPage,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof BlogAppearanceSettingsPage>;

export const Default: Story = {
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
  ]
};

export const WithoutPlusFeatures: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DashboardLayout>
          <DashboardSplashLayout>
            <StorybookBlogDashboardLayout blog={{ has_plus_features: false }}>
              <DefaultBlogDashboardRightSidebarLayout>
                <Story />
              </DefaultBlogDashboardRightSidebarLayout>
            </StorybookBlogDashboardLayout>
          </DashboardSplashLayout>
        </DashboardLayout>,
        { ignore_primitive_providers: false, logged_in: true }
      )
  ]
};
