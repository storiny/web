// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import AspectRatio from "./AspectRatio";

const meta: Meta<typeof AspectRatio> = {
  title: "Components/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
  args: {
    ratio: 16 / 9,
    children: (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={"A photograph of Tokyo city captured during night"}
        src={"/images/display/tokyo.jpg"}
      />
    ),
    objectFit: "cover",
  },
};

export default meta;
type Story = StoryObj<typeof AspectRatio>;

export const Default: Story = {};
