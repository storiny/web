// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../../layout";
import DashboardSplashLayout from "../../../../../layout";
import StorybookBlogDashboardLayout from "../../../layout.storybook";
import DefaultBlogDashboardRightSidebarLayout from "../../layout";
import DomainSettingsPage from "./client";

const meta: Meta<typeof DomainSettingsPage> = {
  title: "blog-dashboard/advanced/domain",
  component: DomainSettingsPage,
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DashboardLayout>
          <DashboardSplashLayout>
            <StorybookBlogDashboardLayout role={"owner"}>
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
type Story = StoryObj<typeof DomainSettingsPage>;

export const Default: Story = {};
