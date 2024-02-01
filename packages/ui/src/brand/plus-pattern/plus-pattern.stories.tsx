// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import PlusPattern from "./plus-pattern";

const meta: Meta<typeof PlusPattern> = {
  title: "brand/plus-pattern",
  component: PlusPattern,
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof PlusPattern>;

export const Default: Story = {};
