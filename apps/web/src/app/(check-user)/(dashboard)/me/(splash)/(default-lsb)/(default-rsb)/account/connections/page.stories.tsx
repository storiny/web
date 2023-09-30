// noinspection JSUnusedGlobalSymbols

import { Provider } from "@storiny/shared";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../../layout";
import DashboardSplashLayout from "../../../../layout";
import DefaultDashboardLeftSidebarLayout from "../../../layout";
import DefaultDashboardRightSidebarLayout from "../../layout";
import AccountConnectionsPage from "./client";

const meta: Meta<typeof AccountConnectionsPage> = {
  title: "dashboard/account/connections",
  component: AccountConnectionsPage,
  args: {
    connections: [
      {
        id: "0",
        provider: Provider.GITHUB,
        url: "/",
        created_at: new Date().toJSON(),
        display_name: "zignis",
        hidden: false
      }
    ]
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AccountConnectionsPage>;

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
