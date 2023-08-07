// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import RectangleIcon from "~/icons/Rectangle";

import Button from "../Button";
import Confirmation from "./Confirmation";
import { ConfirmationProps } from "./Confirmation.props";
import { useConfirmation } from "./useConfirmation";

const meta: Meta<typeof Confirmation> = {
  title: "Components/Confirmation",
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
  const [element, confirm] = useConfirmation(
    <Button onClick={(): void => confirm(props)}>Show confirmation</Button>
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
