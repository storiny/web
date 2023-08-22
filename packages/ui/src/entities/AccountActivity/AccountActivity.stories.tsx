// noinspection JSUnusedGlobalSymbols

import { AccountActivityType } from "@storiny/shared";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { DateFormat, formatDate } from "~/utils/formatDate";

import { mockUsers } from "../../mocks";
import AccountActivity from "./AccountActivity";
import AccountActivitySkeleton from "./Skeleton";

const meta: Meta<typeof AccountActivity> = {
  title: "Entities/AccountActivity",
  component: AccountActivity,
  args: {
    hidePipe: true,
    accountActivity: {
      type: AccountActivityType.ACCOUNT_CREATION,
      description: `You created this account on <m>${formatDate(
        mockUsers[4].created_at,
        DateFormat.STANDARD
      )}</m>.`,
      id: "0",
      created_at: mockUsers[4].created_at
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AccountActivity>;

export const Default: Story = {};

export const Skeleton: Story = {
  render: () => <AccountActivitySkeleton hidePipe />
};
