// noinspection JSUnusedGlobalSymbols

import { AccountActivityType } from "@storiny/shared";
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { DateFormat, format_date } from "src/utils/format-date";

import { MOCK_USERS } from "../../mocks";
import AccountActivity from "./account-activity";
import AccountActivitySkeleton from "./skeleton";

const meta: Meta<typeof AccountActivity> = {
  title: "entities/account-activity",
  component: AccountActivity,
  args: {
    hide_pipe: true,
    account_activity: {
      type: AccountActivityType.ACCOUNT_CREATION,
      description: `You created this account on <m>${format_date(
        MOCK_USERS[4].created_at,
        DateFormat.STANDARD
      )}</m>.`,
      id: "0",
      created_at: MOCK_USERS[4].created_at
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AccountActivity>;

export const Default: Story = {};

export const Skeleton: Story = {
  render: () => <AccountActivitySkeleton hide_pipe />
};
