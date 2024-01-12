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
    data: {
      Internal: 256,
      "twitter.com": 56,
      "example.com": 118,
      "google.com": 95,
      "bing.com": 166
    },
    icon_map: {
      Internal: <HomeIcon />
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof StatBars>;

export const Default: Story = {};
