// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import ResponseTextarea from "./response-textarea";

const meta: Meta<typeof ResponseTextarea> = {
  title: "entities/response-textarea",
  component: ResponseTextarea,
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof ResponseTextarea>;

export const Default: Story = {};
