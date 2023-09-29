// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import RadioGroup from "../radio-group";
import Radio from "./radio";

const meta: Meta<typeof Radio> = {
  title: "components/radio",
  component: Radio,
  decorators: [
    (Story): React.ReactElement => (
      <RadioGroup>
        <Story />
      </RadioGroup>
    )
  ],
  tags: ["autodocs"],
  args: {
    label: "Radio label",
    "aria-label": "Sample radio",
    color: "inverted",
    size: "md"
  },
  argTypes: {
    disabled: {
      name: "disabled",
      type: { name: "boolean", required: false },
      defaultValue: false,
      description: "The disabled state.",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" }
      },
      control: {
        type: "boolean"
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Radio>;

export const Default: Story = {
  args: {
    value: "default"
  }
};

export const ColorInverted: Story = {
  args: {
    color: "inverted",
    value: "inverted"
  }
};

export const ColorRuby: Story = {
  args: {
    color: "ruby",
    value: "ruby"
  }
};

export const SizeLG: Story = {
  args: {
    size: "lg",
    value: "lg"
  }
};

export const SizeMD: Story = {
  args: {
    size: "md",
    value: "md"
  }
};
