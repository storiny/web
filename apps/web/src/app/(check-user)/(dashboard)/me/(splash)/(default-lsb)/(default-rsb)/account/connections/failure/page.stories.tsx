// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../../../layout";
import DashboardSplashLayout from "../../../../../layout";
import DefaultDashboardLeftSidebarLayout from "../../../../layout";
import DefaultDashboardRightSidebarLayout from "../../../layout";
import AccountConnectionFailurePage from "./client";

const meta: Meta<typeof AccountConnectionFailurePage> = {
  title: "dashboard/account/connections/failure",
  component: AccountConnectionFailurePage,
  args: {
    display_name: "Twitter",
    type: "state-mismatch"
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AccountConnectionFailurePage>;

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

export const LinkingError: Story = {
  ...Default,
  args: {
    ...Default.args,
    type: "link"
  }
};
