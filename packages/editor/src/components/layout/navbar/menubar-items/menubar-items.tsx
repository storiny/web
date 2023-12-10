"use client";

import { useAtomValue as use_atom_value } from "jotai";
import NextLink from "next/link";
import React from "react";

import MenubarItem from "~/components/menubar-item";
import Separator from "~/components/separator";

import { doc_status_atom, story_metadata_atom } from "../../../../atoms";
import { is_doc_editable } from "../../../../utils/is-doc-editable";
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
  const story = use_atom_value(story_metadata_atom);
  const doc_status = use_atom_value(doc_status_atom);
  const disabled = !is_doc_editable(doc_status);

  return (
    <React.Fragment>
      <MenubarItem
        as={NextLink}
        href={`/me/content/${story.published_at ? "stories" : "drafts"}`}
      >
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
