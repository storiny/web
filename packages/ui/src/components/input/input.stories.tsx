// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import CheckIcon from "~/icons/check";
import RectangleIcon from "~/icons/rectangle";

import IconButton from "../icon-button";
import Option from "../option";
import Select from "../select";
import Input from "./input";

const meta: Meta<typeof Input> = {
  title: "components/input",
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
    end_decorator: {
      options: ["Button", "Select", "None"],
      control: { type: "select" },
      mapping: {
        Button: (
          <IconButton>
            <CheckIcon />
          </IconButton>
        ),
        Select: (
          <Select slot_props={{ value: { placeholder: "Select" } }}>
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
    slot_props: {
      container: {
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
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
