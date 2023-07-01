// noinspection JSUnusedGlobalSymbols

import { GetProfileResponse } from "@storiny/proto/gen/ts/profile_def/v1/def";
import { Provider, UserFlag } from "@storiny/shared";
import { mockUsers } from "@storiny/ui/src/mocks";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { renderWithState } from "~/redux/mock";

import DefaultLayout from "../layout";
import Profile from "./component";

const user = mockUsers[9];
const mockResponse = {
  ...user,
  is_following: false,
  is_subscribed: false,
  is_blocking: false,
  is_muted: false,
  is_blocked_by_user: false,
  is_self: false,
  is_friend: false,
  is_private: false,
  connections: [
    {
      url: "https://github.com/storiny",
      provider: Provider.GITHUB
    },
    {
      url: "https://twitter.com/storiny_intl",
      provider: Provider.TWITTER
    }
  ]
} as GetProfileResponse;

const meta: Meta<typeof Profile> = {
  title: "pages/Profile",
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
    profile: mockResponse
  },
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { ignorePrimitiveProviders: true }
      )
  ]
};

export const LoggedIn: Story = {
  args: {
    profile: mockResponse
  },
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { ignorePrimitiveProviders: true, loggedIn: true }
      )
  ]
};

export const SelfPrivate: Story = {
  args: {
    profile: { ...mockResponse, is_private: true, is_self: true }
  },
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { ignorePrimitiveProviders: true, loggedIn: true }
      )
  ]
};

export const Private: Story = {
  args: {
    profile: { ...mockResponse, is_private: true }
  },
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { ignorePrimitiveProviders: true }
      )
  ]
};

export const Blocking: Story = {
  args: {
    profile: { ...mockResponse, is_blocking: true }
  },
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { ignorePrimitiveProviders: true, loggedIn: true }
      )
  ]
};

export const BlockedByUser: Story = {
  args: {
    profile: { ...mockResponse, is_blocked_by_user: true }
  },
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { ignorePrimitiveProviders: true, loggedIn: true }
      )
  ]
};

export const Suspended: Story = {
  args: {
    profile: { ...mockResponse, public_flags: UserFlag.TEMPORARILY_SUSPENDED }
  },
  decorators: [
    (Story): React.ReactElement =>
      renderWithState(
        <DefaultLayout>
          <Story />
        </DefaultLayout>,
        { ignorePrimitiveProviders: true }
      )
  ]
};
