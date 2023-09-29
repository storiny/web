// noinspection JSUnusedGlobalSymbols

import { AssetRating } from "@storiny/shared";
import type { Meta, StoryObj } from "@storybook/react";

import Image from "./image";

const meta: Meta<typeof Image> = {
  title: "components/image",
  component: Image,
  tags: ["autodocs"],
  args: {
    img_key: "tokyo.jpg",
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

export const Rated: Story = {
  args: {
    ...Default.args,
    rating: AssetRating.SENSITIVE
  }
};

export const Fallback: Story = {
  args: {
    img_key: "/broken_src"
  }
};
