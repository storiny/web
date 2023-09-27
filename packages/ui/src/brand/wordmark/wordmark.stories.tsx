// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import Wordmark from "./wordmark";

const meta: Meta<typeof Wordmark> = {
  title: "brand/wordmark",
  component: Wordmark,
  args: { size: "md" },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Wordmark>;

export const Default: Story = {};

export const WithBetaLabel: Story = {
  args: {
    show_beta: true
  }
};

export const SizeLG: Story = {
  args: {
    size: "lg"
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
