"use client";

import { useAtomValue } from "jotai";
import NextLink from "next/link";
import React from "react";

import MenubarItem from "../../../../../../ui/src/components/menubar-item";
import Separator from "../../../../../../ui/src/components/separator";

import { docStatusAtom } from "../../../../atoms";
import AlignItem from "./align";
import EditItem from "./edit";
import FileItem from "./file";
import HelpItem from "./help";
import InsertItem from "./insert";
import TextItem from "./text";
import ThemeItem from "./theme";

const EditorMenubarItems = ({
  disabled: disabled_prop
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const docStatus = use_atom_value(docStatusAtom);
  const disabled = ["connecting", "reconnecting", "publishing"].includes(
    docStatus
  );

  return (
    <React.Fragment>
      <MenubarItem as={NextLink} href={"/me/account/stories"}>
        Dashboard
      </MenubarItem>
      <MenubarItem as={NextLink} href={"/"}>
        Home
      </MenubarItem>
      <Separator />
      {!disabled_prop && (
        <React.Fragment>
          <FileItem />
          <EditItem disabled={disabled} />
          <TextItem disabled={disabled} />
          <AlignItem disabled={disabled} />
          <InsertItem disabled={disabled} />
          <Separator />
        </React.Fragment>
      )}
      <ThemeItem />
      <Separator />
      <HelpItem />
    </React.Fragment>
  );
};

export default EditorMenubarItems;
