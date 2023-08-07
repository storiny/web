// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import CheckIcon from "~/icons/Check";
import RectangleIcon from "~/icons/Rectangle";

import IconButton from "../IconButton";
import Option from "../Option";
import Select from "../Select";
import Input from "./Input";

const meta: Meta<typeof Input> = {
  title: "Components/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {
    decorator: {
      options: ["Icon", "None"],
      control: { type: "select" },
      mapping: {
        Icon: <RectangleIcon />,
        None: undefined
      }
    },
    endDecorator: {
      options: ["Button", "Select", "None"],
      control: { type: "select" },
      mapping: {
        Button: (
          <IconButton>
            <CheckIcon />
          </IconButton>
        ),
        Select: (
          <Select slotProps={{ value: { placeholder: "Select" } }}>
            {[...Array(3)].map((_, index) => (
              <Option key={`option-${index}`} value={`option-${index}`}>
                Option
              </Option>
            ))}
          </Select>
        ),
        None: undefined
      }
    }
  },
  args: {
    size: "md",
    color: "inverted",
    type: "text",
    placeholder: "Input placeholder",
    slotProps: {
      container: {
        style: { maxWidth: "300px" }
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const TypeNumber: Story = {
  args: {
    min: 0,
    max: 10,
    type: "number"
  }
};

export const ColorInverted: Story = {
  args: {
    color: "inverted"
  }
};

export const ColorRuby: Story = {
  args: {
    color: "ruby"
  }
};

export const SizeLG: Story = {
  args: {
    size: "lg"
  }
};

export const SizeMD: Story = {
  args: {
    size: "md"
  }
};

export const SizeSM: Story = {
  args: {
    size: "sm"
  }
};
