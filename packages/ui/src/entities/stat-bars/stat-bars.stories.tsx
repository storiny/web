// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import HomeIcon from "~/icons/home";

import StatBars from "./stat-bars";

const meta: Meta<typeof StatBars> = {
  title: "entities/stat-bars",
  component: StatBars,
  args: {
    max_value: 300,
    data: [
      ["Internal", 3002],
      ["google.com", 1023],
      ["bing.com", 393],
      ["example.com", 232],
      ["twitter.com", 192]
    ],
    icon_map: {
      Internal: <HomeIcon />
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof StatBars>;

export const Default: Story = {};
