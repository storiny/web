// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import UserIcon from "~/icons/User";

import ToggleGroupItem from "../ToggleGroupItem";
import ToggleGroup from "./ToggleGroup";

const meta: Meta<typeof ToggleGroup> = {
  title: "Components/ToggleGroup",
  component: ToggleGroup,
  tags: ["autodocs"],
  args: {
    type: "single",
    defaultValue: "one",
    orientation: "horizontal",
    children: (
      <>
        <ToggleGroupItem aria-label={"First item"} value={"one"}>
          <UserIcon />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label={"Second item"} value={"two"}>
          <UserIcon />
        </ToggleGroupItem>
        <ToggleGroupItem aria-label={"Third item"} value={"three"}>
          <UserIcon />
        </ToggleGroupItem>
      </>
    ),
    size: "md",
  },
  argTypes: {
    disabled: {
      name: "disabled",
      type: { name: "boolean", required: false },
      defaultValue: false,
      description: "The disabled state.",
      table: {
        type: { summary: "boolean" },
        defaultValue: { summary: "false" },
      },
      control: {
        type: "boolean",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const Default: Story = {};

export const TypeMultiple: Story = {
  args: {
    type: "multiple",
  },
};

export const OrientationVertical: Story = {
  args: {
    orientation: "vertical",
  },
};

export const WithTooltip: Story = {
  args: {
    defaultValue: "one",
    children: (
      <>
        <ToggleGroupItem
          aria-label={"First item"}
          tooltipContent={"First item"}
          value={"one"}
        >
          <UserIcon />
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label={"Second item"}
          tooltipContent={"Second item"}
          value={"two"}
        >
          <UserIcon />
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label={"Third item"}
          tooltipContent={"Third item"}
          value={"three"}
        >
          <UserIcon />
        </ToggleGroupItem>
      </>
    ),
  },
};

export const SizeLG: Story = {
  args: {
    size: "lg",
  },
};

export const SizeMD: Story = {
  args: {
    size: "md",
  },
};

export const SizeSM: Story = {
  args: {
    size: "sm",
  },
};

export const SizeXS: Story = {
  args: {
    size: "xs",
  },
};
