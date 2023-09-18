"use client";

import NextLink from "next/link";
import React from "react";

import MenubarItem from "~/components/MenubarItem";
import Separator from "~/components/Separator";

import AlignItem from "./align";
import EditItem from "./edit";
import FileItem from "./file";
import HelpItem from "./help";
import InsertItem from "./insert";
import TextItem from "./text";
import ThemeItem from "./theme";

const EditorMenubarItems = (): React.ReactElement => (
  <React.Fragment>
    <MenubarItem as={NextLink} href={"/me/account/stories"}>
      Dashboard
    </MenubarItem>
    <MenubarItem as={NextLink} href={"/"}>
      Home
    </MenubarItem>
    <Separator />
    <FileItem />
    <EditItem />
    <TextItem />
    <AlignItem />
    <InsertItem />
    <Separator />
    <ThemeItem />
    <Separator />
    <HelpItem />
  </React.Fragment>
);

export default EditorMenubarItems;
