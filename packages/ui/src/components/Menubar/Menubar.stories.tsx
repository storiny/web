// noinspection JSUnusedGlobalSymbols

import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import MenubarCheckboxItem from "~/components/MenubarCheckboxItem";
import MenubarSub from "~/components/MenubarSub";
import RectangleIcon from "~/icons/Rectangle";

import Button from "../Button";
import MenubarItem from "../MenubarItem";
import MenubarMenu from "../MenubarMenu";
import Separator from "../Separator";
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
      {[...Array(8)].map((_, index) => (
        <React.Fragment key={index}>
          {index <= 2 ? (
            <MenubarCheckboxItem
              checked
              decorator={<RectangleIcon />}
              rightSlot={"⌘+T"}
            >
              Checkbox item
            </MenubarCheckboxItem>
          ) : (
            <MenubarItem decorator={<RectangleIcon />} rightSlot={"⌘+T"}>
              Menubar item
            </MenubarItem>
          )}
          {index === 2 && <Separator />}
          {index === 4 && (
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
          )}
        </React.Fragment>
      ))}
    </MenubarMenu>
  </Menubar>
);

export const Default: Story = {
  render: (args) => <MenuComponent {...args} />
};
