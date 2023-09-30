// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Button from "~/components/button";

import SymbolPicker from "./symbol-picker";

const meta: Meta<typeof SymbolPicker> = {
  title: "entities/symbol-picker",
  component: SymbolPicker,
  args: {
    children: <Button>Pick a symbol</Button>
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof SymbolPicker>;

export const Default: Story = {};
