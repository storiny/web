// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Button from "~/components/Button";

import Gallery from "./Gallery";

const meta: Meta<typeof Gallery> = {
  title: "Entities/Gallery",
  component: Gallery,
  args: {
    children: <Button>Open gallery</Button>
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Gallery>;

export const Default: Story = {};
