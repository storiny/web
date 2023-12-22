// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import RectangleIcon from "~/icons/rectangle";

import CircularProgress from "./circular-progress";

const meta: Meta<typeof CircularProgress> = {
  title: "components/circular-progress",
  component: CircularProgress,
  tags: ["autodocs"],
  args: {
    size: "md",
    value: 50
  }
};

export default meta;
type Story = StoryObj<typeof CircularProgress>;

export const Default: Story = {};

export const WithChildren: Story = {
  args: {
    children: <RectangleIcon size={12} />
  }
};

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

export const SizeXS: Story = {
  args: {
    size: "xs"
  }
};
