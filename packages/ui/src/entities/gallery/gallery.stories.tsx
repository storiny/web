// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Button from "~/components/button";

import Gallery from "./gallery";

const meta: Meta<typeof Gallery> = {
  title: "entities/gallery",
  component: Gallery,
  args: {
    children: <Button>Open gallery</Button>
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Gallery>;

export const Default: Story = {};
