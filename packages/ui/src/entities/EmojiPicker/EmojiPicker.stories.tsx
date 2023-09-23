// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Button from "~/components/Button";

import EmojiPicker from "./EmojiPicker";

const meta: Meta<typeof EmojiPicker> = {
  title: "entities/EmojiPicker",
  component: EmojiPicker,
  args: {
    children: <Button>Pick an emoji</Button>
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof EmojiPicker>;

export const Default: Story = {};
