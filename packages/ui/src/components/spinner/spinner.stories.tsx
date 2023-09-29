// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import RectangleIcon from "src/icons/rectangle";

import Spinner from "./spinner";

const meta: Meta<typeof Spinner> = {
  title: "components/spinner",
  component: Spinner,
  tags: ["autodocs"],
  args: {
    size: "md"
  }
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {};

export const TypeDeterminate: Story = {
  args: {
    value: 50
  }
};

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
