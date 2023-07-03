// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import UserIcon from "~/icons/User";

import Option from "../Option";
import Separator from "../Separator";
import Select from "./Select";
import { SelectProps } from "./Select.props";
import SelectGroup from "./SelectGroup";
import SelectLabel from "./SelectLabel";

const meta: Meta<typeof Select> = {
  title: "Components/Select",
  component: Select,
  tags: ["autodocs"],
  args: {
    size: "md",
    color: "inverted",
    slotProps: {
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
        <Option decorator={<UserIcon />} value={`option-${index}`}>
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
