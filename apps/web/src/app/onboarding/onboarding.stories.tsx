// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Button from "~/components/button";

import Onboarding from "./onboarding";

const meta: Meta<typeof Onboarding> = {
  title: "miscellaneous/onboarding",
  component: Onboarding,
  args: {
    children: <Button>Open gallery</Button>
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Onboarding>;

export const Default: Story = {};
