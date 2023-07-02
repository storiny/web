// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import UserIcon from "~/icons/User";

import CustomState from "./CustomState";

const meta: Meta<typeof CustomState> = {
  title: "Entities/CustomState",
  component: CustomState,
  args: { size: "md", title: "Title", description: "Description" },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof CustomState>;

export const Default: Story = {};

export const WithIcon: Story = {
  args: {
    icon: <UserIcon />
  }
};

export const SizeMD: Story = {
  args: {
    size: "md"
  }
};

export const SizeSM: Story = {
  args: {
    size: "sm"
  }
};
