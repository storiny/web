// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../layout";
import DashboardSplashLayout from "../../../../layout";
import StorybookBlogDashboardLayout from "../../layout.storybook";
import BlogGeneralSettingsPage from "./client";

const meta: Meta<typeof BlogGeneralSettingsPage> = {
  title: "blog-dashboard/settings/general",
  component: BlogGeneralSettingsPage,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof BlogGeneralSettingsPage>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DashboardLayout>
          <DashboardSplashLayout>
            <StorybookBlogDashboardLayout
              blog={{ has_plus_features: true }}
              role={"owner"}
            >
              <Story />
            </StorybookBlogDashboardLayout>
          </DashboardSplashLayout>
        </DashboardLayout>,
        { ignore_primitive_providers: false, logged_in: true }
      )
  ]
};

export const AsEditor: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DashboardLayout>
          <DashboardSplashLayout>
            <StorybookBlogDashboardLayout
              blog={{ has_plus_features: true }}
              role={"editor"}
            >
              <Story />
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
              <Story />
            </StorybookBlogDashboardLayout>
          </DashboardSplashLayout>
        </DashboardLayout>,
        { ignore_primitive_providers: false, logged_in: true }
      )
  ]
};
