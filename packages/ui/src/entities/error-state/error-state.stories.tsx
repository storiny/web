// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import ErrorState from "./error-state";

const meta: Meta<typeof ErrorState> = {
  title: "entities/error-state",
  component: ErrorState,
  args: { size: "md", type: "network" },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

export const Default: Story = {};

export const TypeNetwork: Story = {
  args: {
    type: "network"
  }
};

export const TypeServer: Story = {
  args: {
    type: "server"
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
