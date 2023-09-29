// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import RectangleIcon from "src/icons/rectangle";

import Button from "../button";
import MenubarCheckboxItem from "../menubar-checkbox-item";
import MenubarItem from "../menubar-item";
import MenubarMenu from "../menubar-menu";
import MenubarRadioGroup from "../menubar-radio-group";
import MenubarRadioItem from "../menubar-radio-item";
import MenubarSub from "../menubar-sub";
import Menubar from "./menubar";
import { MenubarProps } from "./menubar.props";

const meta: Meta<typeof Menubar> = {
  title: "components/menubar",
  component: Menubar,
  args: {
    children: [...Array(5)].map((_, index) => (
      <MenubarItem decorator={<RectangleIcon />} key={index} right_slot={"⌘+T"}>
        Menubar item
      </MenubarItem>
    ))
  },
  tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Menubar>;

const MenuComponent = (args?: MenubarProps): React.ReactElement => (
  <Menubar {...args}>
    <MenubarMenu
      trigger={<Button aria-label={"Show menubar"}>Show menubar</Button>}
    >
      {args?.children}
    </MenubarMenu>
  </Menubar>
);

export const Default: Story = {
  render: (args) => <MenuComponent {...args} />
};

export const Submenu: Story = {
  ...Default,
  args: {
    children: (
      <MenubarSub trigger={<div>Sub menu</div>}>
        {[...Array(4)].map((_, index) => (
          <MenubarItem
            decorator={<RectangleIcon />}
            key={index}
            right_slot={"⌘+T"}
          >
            Submenu item
          </MenubarItem>
        ))}
      </MenubarSub>
    )
  }
};

export const CheckboxItem: Story = {
  ...Default,
  args: {
    children: [...Array(5)].map((_, index) => (
      <MenubarCheckboxItem
        checked={index === 1}
        decorator={<RectangleIcon />}
        key={index}
        right_slot={"⌘+T"}
      >
        Checkbox item
      </MenubarCheckboxItem>
    ))
  }
};

export const RadioItem: Story = {
  ...Default,
  args: {
    children: (
      <MenubarRadioGroup value={"1"}>
        {[...Array(5)].map((_, index) => (
          <MenubarRadioItem
            decorator={<RectangleIcon />}
            key={index}
            right_slot={"⌘+T"}
            value={`${index}`}
          >
            Radio item
          </MenubarRadioItem>
        ))}
      </MenubarRadioGroup>
    )
  }
};
