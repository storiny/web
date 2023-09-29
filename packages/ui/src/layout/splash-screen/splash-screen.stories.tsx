// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import SplashScreen from "./splash-screen";

const meta: Meta<typeof SplashScreen> = {
  title: "layout/splash-screen",
  component: SplashScreen,
  args: {
    force_mount: true
  },
  parameters: {
    layout: "fullscreen"
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof SplashScreen>;

export const Default: Story = {};
