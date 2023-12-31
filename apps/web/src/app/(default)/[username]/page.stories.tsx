// noinspection JSUnusedGlobalSymbols

import { GetProfileResponse } from "@storiny/proto/dist/profile_def/v1/def";
import { Provider, UserFlag } from "@storiny/shared";
import { MOCK_USERS } from "@storiny/ui/src/mocks";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { render_with_state } from "~/redux/mock";

import DefaultLayout from "../layout";
import Profile from "./component";

const USER = MOCK_USERS[9];
const MOCK_RESPONSE = {
  ...USER,
  is_following: false,
  is_subscribed: false,
  is_blocked: false,
  is_muted: false,
  is_blocked_by_user: false,
  is_self: false,
  is_friend: false,
  is_private: false,
  connections: [
    {
      url: "https://github.com/storiny",
      provider: Provider.GITHUB,
      display_name: "Some user"
    }
  ]
} as GetProfileResponse;

const meta: Meta<typeof Profile> = {
  title: "pages/profile",
  component: Profile,
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Profile>;

export const Default: Story = {
  args: {
    profile: MOCK_RESPONSE
  },
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};

export const LoggedIn: Story = {
  args: {
    profile: MOCK_RESPONSE
  },
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { ignore_primitive_providers: true, logged_in: true }
      )
  ]
};

export const SelfPrivate: Story = {
  args: {
    profile: { ...MOCK_RESPONSE, is_private: true, is_self: true }
  },
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { ignore_primitive_providers: true, logged_in: true }
      )
  ]
};

export const Private: Story = {
  args: {
    profile: { ...MOCK_RESPONSE, is_private: true }
  },
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};

export const Blocking: Story = {
  args: {
    profile: { ...MOCK_RESPONSE, is_blocked: true }
  },
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { ignore_primitive_providers: true, logged_in: true }
      )
  ]
};

export const BlockedByUser: Story = {
  args: {
    profile: { ...MOCK_RESPONSE, is_blocked_by_user: true }
  },
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { ignore_primitive_providers: true, logged_in: true }
      )
  ]
};

export const Suspended: Story = {
  args: {
    profile: { ...MOCK_RESPONSE, public_flags: UserFlag.TEMPORARILY_SUSPENDED }
  },
  decorators: [
    (Story): React.ReactElement =>
      render_with_state(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { ignore_primitive_providers: true }
      )
  ]
};
