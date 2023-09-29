// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Avatar from "../avatar";
import AvatarGroup from "./avatar-group";

const meta: Meta<typeof AvatarGroup> = {
  title: "components/avatar-group",
  component: AvatarGroup,
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof AvatarGroup>;

export const Default: Story = {
  render: (args) => (
    <AvatarGroup {...args}>
      <Avatar alt={"Test avatar"} avatar_id={"louie.png"} />
      <Avatar alt={"Test avatar"} avatar_id={"kevin.png"} />
      <Avatar alt={"Test avatar"} avatar_id={"oscar.png"} />
      <Avatar alt={"Test avatar"} />
      <Avatar alt={"Test avatar"} />
    </AvatarGroup>
  ),
  args: {
    size: "md"
  }
};

export const SizeXL2: Story = {
  ...Default,
  args: {
    size: "xl2"
  }
};

export const SizeXL: Story = {
  ...Default,
  args: {
    size: "xl"
  }
};

export const SizeLG: Story = {
  ...Default,
  args: {
    size: "lg"
  }
};

export const SizeMD: Story = {
  ...Default,
  args: {
    size: "md"
  }
};

export const SizeSM: Story = {
  ...Default,
  args: {
    size: "sm"
  }
};

export const SizeXS: Story = {
  ...Default,
  args: {
    size: "xs"
  }
};
