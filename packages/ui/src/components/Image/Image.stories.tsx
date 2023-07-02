// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Image from "./Image";

const meta: Meta<typeof Image> = {
  title: "Components/Image",
  component: Image,
  tags: ["autodocs"],
  args: {
    imgId: "/images/display/tokyo.jpg",
    alt: "Test image",
    width: 640,
    height: 320,
    hex: "d3b4ac"
  },
  argTypes: {
    hex: {
      control: "color"
    }
  }
};

export default meta;
type Story = StoryObj<typeof Image>;

export const Default: Story = {};

export const Fallback: Story = {
  args: {
    imgId: "/broken_src"
  }
};
