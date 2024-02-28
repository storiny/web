// noinspection JSUnusedGlobalSymbols

import { DeviceType } from "@storiny/shared";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../layout";
import DashboardSplashLayout from "../../../layout";
import DashboardLeftSidebarLayout from "../../layout";
import AccountLoginActivityPage from "./client";

const meta: Meta<typeof AccountLoginActivityPage> = {
  title: "dashboard/account/login-activity",
  component: AccountLoginActivityPage,
  args: {
    recent: {
      id: "0",
      device: {
        display_name: "Safari on iPhone",
        type: DeviceType.MOBILE
      },
      location: {
        display_name: "Toronto, Canada",
        lng: -79.347,
        lat: 43.6532
      },
      is_active: false,
      created_at: new Date().toJSON()
    },
    logins: [
      {
        id: "0",
        device: {
          display_name: "Firefox on Ubuntu",
          type: DeviceType.COMPUTER
        },
        location: {
          display_name: "Menlo Park, CA",
          lng: -122.181,
          lat: 37.4529
        },
        is_active: true,
        created_at: "2023-05-18T01:07:02.000Z"
      },
      {
        id: "1",
        device: {
          display_name: "Safari on MacBook",
          type: DeviceType.COMPUTER
        },
        location: {
          display_name: "Tokyo, Japan",
          lng: 139.839,
          lat: 35.6528
        },
        is_active: false,
        created_at: "2022-11-18T01:07:02.000Z"
      },
      {
        id: "2",
        device: {
          display_name: "Chrome on Android",
          type: DeviceType.MOBILE
        },
        location: {
          display_name: "Unknown location"
        },
        is_active: false,
        created_at: "2022-10-03T01:07:02.000Z"
      },
      {
        id: "3",
        device: {
          display_name: "Unknown device",
          type: DeviceType.UNKNOWN
        },
        location: {
          display_name: "Atlanta, Georgia",
          lng: -84.386,
          lat: 33.7537
        },
        is_active: false,
        created_at: "2021-07-03T01:07:02.000Z"
      }
    ]
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AccountLoginActivityPage>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DashboardLayout>
          <DashboardSplashLayout>
            <DashboardLeftSidebarLayout>
              <Story />
            </DashboardLeftSidebarLayout>
          </DashboardSplashLayout>
        </DashboardLayout>,
        { ignore_primitive_providers: false, logged_in: true }
      )
  ]
};
