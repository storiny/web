// noinspection JSUnusedGlobalSymbols

import { MOCK_BLOGS, MOCK_USERS } from "@storiny/ui/src/mocks";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import StorybookBlogLayout from "../layout.storybook";
import NewsletterPage from "./client";
import StorybookBlogNewsletterLayout from "./layout.storybook";

const meta: Meta<typeof NewsletterPage> = {
  title: "pages/blog/newsletter",
  component: NewsletterPage,
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
          <StorybookBlogNewsletterLayout
            response={{
              ...MOCK_BLOGS[0],
              description: MOCK_BLOGS[0].description || undefined,
              newsletter_splash_id:
                MOCK_BLOGS[0].newsletter_splash_id || undefined,
              newsletter_splash_hex:
                MOCK_BLOGS[0].newsletter_splash_hex || undefined,
              user: {
                ...MOCK_USERS[0],
                avatar_id: MOCK_USERS[0].avatar_id || undefined,
                avatar_hex: MOCK_USERS[0].avatar_hex || undefined
              },
              is_subscribed: false
            }}
          >
            <Story />
          </StorybookBlogNewsletterLayout>
        </StorybookBlogLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};

export const LoggedIn: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <StorybookBlogLayout>
          <StorybookBlogNewsletterLayout
            response={{
              ...MOCK_BLOGS[0],
              description: MOCK_BLOGS[0].description || undefined,
              newsletter_splash_id:
                MOCK_BLOGS[0].newsletter_splash_id || undefined,
              newsletter_splash_hex:
                MOCK_BLOGS[0].newsletter_splash_hex || undefined,
              user: {
                ...MOCK_USERS[0],
                avatar_id: MOCK_USERS[0].avatar_id || undefined,
                avatar_hex: MOCK_USERS[0].avatar_hex || undefined
              },
              is_subscribed: false
            }}
          >
            <Story />
          </StorybookBlogNewsletterLayout>
        </StorybookBlogLayout>,
        { ignore_primitive_providers: true, logged_in: true }
      )
  ]
};

export const WithoutSplash: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <StorybookBlogLayout>
          <StorybookBlogNewsletterLayout
            response={{
              ...MOCK_BLOGS[0],
              description: MOCK_BLOGS[0].description || undefined,
              newsletter_splash_id: undefined,
              newsletter_splash_hex: undefined,
              user: {
                ...MOCK_USERS[0],
                avatar_id: MOCK_USERS[0].avatar_id || undefined,
                avatar_hex: MOCK_USERS[0].avatar_hex || undefined
              },
              is_subscribed: false
            }}
          >
            <Story />
          </StorybookBlogNewsletterLayout>
        </StorybookBlogLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};

export const Subscribed: Story = {
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <StorybookBlogLayout>
          <StorybookBlogNewsletterLayout
            response={{
              ...MOCK_BLOGS[0],
              description: MOCK_BLOGS[0].description || undefined,
              newsletter_splash_id:
                MOCK_BLOGS[0].newsletter_splash_id || undefined,
              newsletter_splash_hex:
                MOCK_BLOGS[0].newsletter_splash_hex || undefined,
              user: {
                ...MOCK_USERS[0],
                avatar_id: MOCK_USERS[0].avatar_id || undefined,
                avatar_hex: MOCK_USERS[0].avatar_hex || undefined
              },
              is_subscribed: true
            }}
          >
            <Story />
          </StorybookBlogNewsletterLayout>
        </StorybookBlogLayout>,
        { ignore_primitive_providers: true, logged_in: true }
      )
  ]
};
