// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Wordmark from "./Wordmark";

const meta: Meta<typeof Wordmark> = {
  title: "Brand/Wordmark",
  component: Wordmark,
  args: { size: "md" },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Wordmark>;

export const Default: Story = {};

export const WithBetaLabel: Story = {
  args: {
    showBeta: true
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
