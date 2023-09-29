// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";

import TitleBlock from "./title-block";

const meta: Meta<typeof TitleBlock> = {
  title: "entities/title-block",
  component: TitleBlock,
  args: { children: "Block content", title: "Title" },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof TitleBlock>;

export const Default: Story = {};
