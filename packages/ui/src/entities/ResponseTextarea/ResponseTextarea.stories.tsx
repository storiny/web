// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import ResponseTextarea from "./ResponseTextarea";

const meta: Meta<typeof ResponseTextarea> = {
  title: "Entities/ResponseTextarea",
  component: ResponseTextarea,
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof ResponseTextarea>;

export const Default: Story = {};
