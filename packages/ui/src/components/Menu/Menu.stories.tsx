// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import UserIcon from "~/icons/User";

import Button from "../Button";
import Menu from "../Menu";
import MenuItem from "../MenuItem";
import Separator from "../Separator";
import { MenuProps } from "./Menu.props";

const meta: Meta<typeof Menu> = {
  title: "Components/Menu",
  component: Menu,
  tags: ["autodocs"],
  args: {
    size: "md"
  },
  argTypes: {
    open: {
      control: "select",
      options: ["Uncontrolled", "Open", "Closed"],
      mapping: {
        Uncontrolled: undefined,
        Open: true,
        Closed: false
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Menu>;

const MenuComponent = (args?: MenuProps) => (
  <Menu {...args} trigger={<Button aria-label={"Show menu"}>Show menu</Button>}>
    {[...Array(5)].map((_, index) => (
      <React.Fragment key={index}>
        <MenuItem decorator={<UserIcon />} rightSlot={"⌘+T"}>
          Menu item
        </MenuItem>
        {index === 2 && <Separator />}
      </React.Fragment>
    ))}
  </Menu>
);

export const Default: Story = {
  render: (args) => <MenuComponent {...args} />
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
