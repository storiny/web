// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import RectangleIcon from "~/icons/rectangle";

import Option from "../option";
import Separator from "../separator";
import Select from "./select";
import { SelectProps } from "./select.props";
import SelectGroup from "./select-group";
import SelectLabel from "./select-label";

const meta: Meta<typeof Select> = {
  title: "components/select",
  component: Select,
  tags: ["autodocs"],
  args: {
    size: "md",
    color: "inverted",
    slot_props: {
      trigger: {
        "aria-label": "Sample select"
      },
      value: {
        placeholder: "Select a value"
      }
    },

    style: { maxWidth: "256px" }
  }
};

export default meta;
type Story = StoryObj<typeof Select>;

const SelectComponent = (args?: SelectProps): React.ReactElement => (
  <Select {...args}>
    {[...Array(5)].map((_, index) => (
      <React.Fragment key={index}>
        <Option decorator={<RectangleIcon />} value={`option-${index}`}>
          Option
        </Option>
        {index === 2 && <Separator />}
      </React.Fragment>
    ))}
  </Select>
);

export const Default: Story = {
  render: (args) => <SelectComponent {...args} />
};

export const Grouped: Story = {
  render: (args) => (
    <Select {...args}>
      <SelectGroup>
        <SelectLabel>Group 1</SelectLabel>
        {[...Array(3)].map((_, index) => (
          <Option key={index} value={`option-${index}`}>
            Option
          </Option>
        ))}
      </SelectGroup>
      <SelectGroup>
        <SelectLabel>Group 1</SelectLabel>
        {[...Array(2)].map((_, index) => (
          <Option key={index} value={`option-${index}`}>
            Option
          </Option>
        ))}
      </SelectGroup>
    </Select>
  )
};

export const ColorInverted: Story = {
  ...Default,
  args: {
    color: "inverted"
  }
};

export const ColorRuby: Story = {
  ...Default,
  args: {
    color: "ruby"
  }
};

export const SizeLG: Story = {
  ...Default,
  args: {
    size: "lg"
  }
};

export const SizeMD: Story = {
  ...Default,
  args: {
    size: "md"
  }
};

export const SizeSM: Story = {
  ...Default,
  args: {
    size: "sm"
  }
};
