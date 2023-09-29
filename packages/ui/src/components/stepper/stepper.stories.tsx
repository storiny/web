// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import Stepper from "./stepper";

const meta: Meta<typeof Stepper> = {
  title: "components/stepper",
  component: Stepper,
  tags: ["autodocs"],
  args: {
    size: "md",
    total_steps: 3,
    active_steps: 1,
    "aria-label": "Sample stepper",
    style: {
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      maxWidth: "512px"
    }
  }
};

export default meta;
type Story = StoryObj<typeof Stepper>;

export const Default: Story = {};

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
