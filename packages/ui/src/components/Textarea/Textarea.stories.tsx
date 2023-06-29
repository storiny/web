// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Textarea from "./Textarea";

const meta: Meta<typeof Textarea> = {
  title: "Components/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: {
    size: "md",
    color: "inverted",
    slotProps: {
      container: {
        style: { maxWidth: "300px" }
      }
    },
    placeholder: "Textarea placeholder"
  }
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {};

export const ColorInverted: Story = {
  args: {
    color: "inverted"
  }
};

export const ColorRuby: Story = {
  args: {
    color: "ruby"
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
