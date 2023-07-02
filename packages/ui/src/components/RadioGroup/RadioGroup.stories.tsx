// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Radio from "../Radio";
import RadioGroup from "./RadioGroup";

const meta: Meta<typeof RadioGroup> = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  args: { defaultValue: "1" },
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
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: (args) => (
    <RadioGroup {...args}>
      {[...Array(3)].map((_, index) => (
        <Radio
          aria-label={"Sample radio"}
          key={index}
          label={"Radio label"}
          value={String(index)}
        />
      ))}
    </RadioGroup>
  )
};

export const ColorInverted: Story = {
  render: (args) => (
    <RadioGroup {...args}>
      {[...Array(3)].map((_, index) => (
        <Radio
          aria-label={"Sample radio"}
          color={"inverted"}
          key={index}
          label={"Radio label"}
          value={String(index)}
        />
      ))}
    </RadioGroup>
  )
};
export const ColorRuby: Story = {
  render: (args) => (
    <RadioGroup {...args}>
      {[...Array(3)].map((_, index) => (
        <Radio
          aria-label={"Sample radio"}
          color={"ruby"}
          key={index}
          label={"Radio label"}
          value={String(index)}
        />
      ))}
    </RadioGroup>
  )
};

export const SizeLG: Story = {
  render: (args) => (
    <RadioGroup {...args}>
      {[...Array(3)].map((_, index) => (
        <Radio
          aria-label={"Sample radio"}
          key={index}
          label={"Radio label"}
          size={"lg"}
          value={String(index)}
        />
      ))}
    </RadioGroup>
  )
};

export const SizeMD: Story = {
  render: (args) => (
    <RadioGroup {...args}>
      {[...Array(3)].map((_, index) => (
        <Radio
          aria-label={"Sample radio"}
          key={index}
          label={"Radio label"}
          size={"md"}
          value={String(index)}
        />
      ))}
    </RadioGroup>
  )
};
