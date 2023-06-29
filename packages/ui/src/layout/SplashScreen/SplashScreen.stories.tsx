// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import SplashScreen from "./SplashScreen";

const meta: Meta<typeof SplashScreen> = {
  title: "Layout/SplashScreen",
  component: SplashScreen,
  args: {
    forceMount: true,
  },
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SplashScreen>;

export const Default: Story = {};
