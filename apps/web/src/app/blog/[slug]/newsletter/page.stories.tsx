// noinspection JSUnusedGlobalSymbols

import { MOCK_BLOGS, MOCK_USERS } from "@storiny/ui/src/mocks";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import StorybookBlogLayout from "../layout.storybook";
import NewsletterPage from "./client";
import BlogNewsletterLayout from "./layout";

const meta: Meta<typeof NewsletterPage> = {
  title: "pages/blog/newsletter",
  component: NewsletterPage,
  args: {
    ...MOCK_BLOGS[0],
    user: MOCK_USERS[0],
    is_subscribed: false
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof NewsletterPage>;

export const Default: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <StorybookBlogLayout>
          <BlogNewsletterLayout>
            <Story />
          </BlogNewsletterLayout>
        </StorybookBlogLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};

export const WithoutSplash: Story = {
  ...Default,
  args: {
    ...Default.args,
    newsletter_splash_id: undefined
  }
};

export const Subscribed: Story = {
  ...Default,
  args: {
    ...Default.args,
    is_subscribed: true
  }
};
