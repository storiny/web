// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../layout";
import DashboardSplashLayout from "../../layout";
import DefaultDashboardLeftSidebarLayout from "../layout";
import DefaultDashboardRightSidebarLayout from "./layout";
import NavigationPage from "./page";

const meta: Meta<typeof NavigationPage> = {
  title: "dashboard/NavigationPage",
  component: NavigationPage,
  args: {
    disableRedirect: true
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof NavigationPage>;

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
        { ignore_primitive_providers: true, logged_in: true }
      )
  ]
};
