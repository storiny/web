// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../layout";
import DashboardSplashLayout from "../../../layout";
import StorybookBlogDashboardLayout from "../layout.storybook";
import DefaultBlogDashboardRightSidebarLayout from "./layout";
import BlogNavigationPage from "./page";

const meta: Meta<typeof BlogNavigationPage> = {
  title: "blog-dashboard/navigation-page",
  component: BlogNavigationPage,
  args: {
    disable_redirect: true
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof BlogNavigationPage>;

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
        { ignore_primitive_providers: true, logged_in: true }
      )
  ]
};
