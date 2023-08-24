// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import RectangleIcon from "~/icons/Rectangle";

import Button from "../Button";
import MenubarCheckboxItem from "../MenubarCheckboxItem";
import MenubarItem from "../MenubarItem";
import MenubarMenu from "../MenubarMenu";
import MenubarRadioGroup from "../MenubarRadioGroup";
import MenubarRadioItem from "../MenubarRadioItem";
import MenubarSub from "../MenubarSub";
import Menubar from "./Menubar";
import { MenubarProps } from "./Menubar.props";

const meta: Meta<typeof Menubar> = {
  title: "Components/Menubar",
  component: Menubar,
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
  render: (args) => <MenuComponent {...args} />,
  args: {
    children: [...Array(5)].map((_, index) => (
      <MenubarItem decorator={<RectangleIcon />} key={index} rightSlot={"⌘+T"}>
        Menubar item
      </MenubarItem>
    ))
  }
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
            rightSlot={"⌘+T"}
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
        rightSlot={"⌘+T"}
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
            rightSlot={"⌘+T"}
            value={`${index}`}
          >
            Radio item
          </MenubarRadioItem>
        ))}
      </MenubarRadioGroup>
    )
  }
};
