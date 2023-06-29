// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Stepper from "./Stepper";

const meta: Meta<typeof Stepper> = {
  title: "Components/Stepper",
  component: Stepper,
  tags: ["autodocs"],
  args: {
    size: "md",
    totalSteps: 3,
    activeSteps: 1,
    "aria-label": "Sample stepper",
    style: {
      maxWidth: "512px",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Stepper>;

export const Default: Story = {};

export const SizeMD: Story = {
  args: {
    size: "md",
  },
};

export const SizeSM: Story = {
  args: {
    size: "sm",
  },
};
