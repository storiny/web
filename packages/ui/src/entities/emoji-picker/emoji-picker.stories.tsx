// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Button from "src/components/button";

import EmojiPicker from "./emoji-picker";

const meta: Meta<typeof EmojiPicker> = {
  title: "entities/emoji-picker",
  component: EmojiPicker,
  args: {
    children: <Button>Pick an emoji</Button>
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof EmojiPicker>;

export const Default: Story = {};
