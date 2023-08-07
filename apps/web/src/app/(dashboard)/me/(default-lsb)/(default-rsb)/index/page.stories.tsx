// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import DashboardLayout from "../../../../layout";
import DefaultDashboardLeftSidebarLayout from "../../layout";
import DefaultDashboardRightSidebarLayout from "../layout";
import Index from "./page";

const meta: Meta<typeof Index> = {
  title: "dashboard/Index",
  component: Index,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Index>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <DashboardLayout>
          <DefaultDashboardLeftSidebarLayout>
            <DefaultDashboardRightSidebarLayout>
              <Story />
            </DefaultDashboardRightSidebarLayout>
          </DefaultDashboardLeftSidebarLayout>
        </DashboardLayout>,
        { ignorePrimitiveProviders: true, loggedIn: true }
      )
  ]
};
