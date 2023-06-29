// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import MultiSelect from "./MultiSelect";

const meta: Meta<typeof MultiSelect> = {
  title: "Components/MultiSelect",
  component: MultiSelect,
  args: {
    style: { maxWidth: "300px" },
    options: [
      { value: "one", label: "First option" },
      { value: "two", label: "Second option" },
      { value: "three", label: "Third option" },
    ],
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MultiSelect>;

export const Default: Story = {};

export const ColorInverted: Story = {
  args: {
    color: "inverted",
  },
};

export const ColorRuby: Story = {
  args: {
    color: "ruby",
  },
};

export const SizeLG: Story = {
  args: {
    size: "lg",
  },
};

export const SizeMD: Story = {
  args: {
    size: "md",
  },
};
