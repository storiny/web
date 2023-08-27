// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import MenuCheckboxItem from "~/components/MenuCheckboxItem";
import RectangleIcon from "~/icons/Rectangle";

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
    size: "md",
    children: [...Array(5)].map((_, index) => (
      <React.Fragment key={index}>
        <MenuItem decorator={<RectangleIcon />} rightSlot={"⌘+T"}>
          Menu item
        </MenuItem>
        {index === 2 && <Separator />}
      </React.Fragment>
    ))
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
type Story = StoryObj<typeof Menu>;

const MenuComponent = (args?: MenuProps): React.ReactElement => (
  <Menu {...args} trigger={<Button aria-label={"Show menu"}>Show menu</Button>}>
    {args?.children}
  </Menu>
);

export const Default: Story = {
  render: (args) => <MenuComponent {...args} />
};

export const CheckboxItem: Story = {
  ...Default,
  args: {
    children: [...Array(5)].map((_, index) => (
      <React.Fragment key={index}>
        <MenuCheckboxItem decorator={<RectangleIcon />} rightSlot={"⌘+T"}>
          Checkbox item
        </MenuCheckboxItem>
        {index === 2 && <Separator />}
      </React.Fragment>
    ))
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
