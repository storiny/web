// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import Avatar from "./avatar";

const meta: Meta<typeof Avatar> = {
  title: "components/avatar",
  component: Avatar,
  tags: ["autodocs"],
  args: { size: "md" },
  argTypes: {
    hex: {
      control: "color"
    }
  }
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    alt: "Test avatar",
    src: "/images/avatars/kevin.png",
    hex: "d3b4ac"
  }
};

export const Fallback: Story = {
  args: {
    alt: "Test avatar",
    src: ""
  }
};

export const SizeXL2: Story = {
  args: {
    ...Default.args,
    size: "xl2"
  }
};

export const SizeXL: Story = {
  args: {
    ...Default.args,
    size: "xl"
  }
};

export const SizeLG: Story = {
  args: {
    ...Default.args,
    size: "lg"
  }
};

export const SizeMD: Story = {
  args: {
    ...Default.args,
    size: "md"
  }
};

export const SizeSM: Story = {
  args: {
    ...Default.args,
    size: "sm"
  }
};

export const SizeXS: Story = {
  args: {
    ...Default.args,
    size: "xs"
  }
};
