// noinspection JSUnusedGlobalSymbols

import { MOCK_BLOGS, MOCK_USERS } from "@storiny/ui/src/mocks";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import StorybookBlogLayout from "../../layout.storybook";
import StorybookBlogNewsletterLayout from "../layout.storybook";
import NewsletterTokenPage from "./client";

const meta: Meta<typeof NewsletterTokenPage> = {
  title: "pages/blog/newsletter/token",
  args: {
    is_valid: true
  },
  component: NewsletterTokenPage,
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
  ],
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof NewsletterTokenPage>;

export const Default: Story = {};

export const InvalidToken: Story = {
  args: {
    is_valid: false
  }
};
