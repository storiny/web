// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { MOCK_USERS } from "../../mocks";
import SubscriberSkeleton from "./skeleton";
import Subscriber from "./subscriber";

const meta: Meta<typeof Subscriber> = {
  title: "entities/subscriber",
  component: Subscriber,
  args: {
    subscriber: {
      email: MOCK_USERS[6].email!,
      id: "0",
      blog_id: "0",
      created_at: new Date().toJSON()
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Subscriber>;

export const Default: Story = {};

export const Skeleton: Story = {
  render: () => <SubscriberSkeleton />
};
