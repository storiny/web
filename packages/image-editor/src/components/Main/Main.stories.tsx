// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Main from "./Main";

const meta: Meta<typeof Main> = {
  title: "packages/ImageEditor",
  component: Main,
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Main>;

export const Default: Story = {};
