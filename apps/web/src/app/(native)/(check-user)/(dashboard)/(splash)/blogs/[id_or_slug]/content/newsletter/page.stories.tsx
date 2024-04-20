// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DashboardLayout from "../../../../../layout";
import DashboardSplashLayout from "../../../../layout";
import StorybookBlogDashboardLayout from "../../layout.storybook";
import BlogContentNewsletterPage from "./client";

const meta: Meta<typeof BlogContentNewsletterPage> = {
  title: "blog-dashboard/content/newsletter",
  component: BlogContentNewsletterPage,
  args: {
    subscriber_count: 5
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof BlogContentNewsletterPage>;

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
