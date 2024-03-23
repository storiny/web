// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../layout";
import DashboardSplashLayout from "../../../../layout";
import StorybookBlogDashboardLayout from "../../layout.storybook";
import BlogContentWritersPage from "./client";

const meta: Meta<typeof BlogContentWritersPage> = {
  title: "blog-dashboard/content/writers",
  component: BlogContentWritersPage,
  args: {
    pending_writer_request_count: 5,
    writer_count: 5
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof BlogContentWritersPage>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DashboardLayout>
          <DashboardSplashLayout>
            <StorybookBlogDashboardLayout blog={{ has_plus_features: true }}>
              <Story />
            </StorybookBlogDashboardLayout>
          </DashboardSplashLayout>
        </DashboardLayout>,
        { ignore_primitive_providers: false, logged_in: true }
      )
  ]
};
