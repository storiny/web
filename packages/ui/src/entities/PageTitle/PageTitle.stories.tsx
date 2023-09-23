// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import PageTitle from "./PageTitle";

const meta: Meta<typeof PageTitle> = {
  title: "entities/PageTitle",
  component: PageTitle,
  args: { children: "Page title" },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof PageTitle>;

export const Default: Story = {};
