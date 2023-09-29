// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import RectangleIcon from "src/icons/rectangle";

import Button from "../button";
import Confirmation from "./confirmation";
import { ConfirmationProps } from "./confirmation.props";
import { use_confirmation } from "./use-confirmation";

const meta: Meta<typeof Confirmation> = {
  title: "components/confirmation",
  component: Confirmation,
  args: {
    color: "inverted",
    decorator: <RectangleIcon />,
    title: "Confirmation title",
    description: "This is a confirmation description"
  },
  argTypes: {
    decorator: {
      options: ["Icon", "None"],
      control: { type: "select" },
      mapping: {
        Icon: <RectangleIcon />,
        None: undefined
      }
    }
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Confirmation>;

const ConfirmationComponent = (
  props: ConfirmationProps
): React.ReactElement => {
  const [element] = use_confirmation(
    ({ open_confirmation }) => (
      <Button onClick={open_confirmation}>Show confirmation</Button>
    ),
    props
  );

  return element;
};

export const Default: Story = {
  render: (args) => <ConfirmationComponent {...args} />
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
