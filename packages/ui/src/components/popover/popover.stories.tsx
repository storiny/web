// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import Button from "../button";
import Popover from "./";
import Typography from "../typography";
import { PopoverProps } from "./popover.props";

const meta: Meta<typeof Popover> = {
  title: "components/popover",
  component: Popover,
  tags: ["autodocs"],
  args: {
    size: "md"
  },
  argTypes: {
    open: {
      options: ["Uncontrolled", "Open", "Closed"],
      control: { type: "select" },
      mapping: {
        Uncontrolled: undefined,
        Open: true,
        Closed: false
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Popover>;

const PopoverComponent = (args?: PopoverProps): React.ReactElement => (
  <Popover
    {...args}
    trigger={<Button aria-label={"Show popover"}>Show popover</Button>}
  >
    <Typography
      className={"t-minor"}
      level={"body2"}
      style={{ padding: "32px" }}
    >
      Popover content
    </Typography>
  </Popover>
);

export const Default: Story = {
  render: (args) => <PopoverComponent {...args} />
};
