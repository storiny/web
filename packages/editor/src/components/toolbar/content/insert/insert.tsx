import { clsx } from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import IconButton from "~/components/icon-button";
import Menu from "~/components/menu";
import PlusIcon from "~/icons/plus";
import css from "~/theme/main.module.scss";

import { doc_status_atom } from "../../../../atoms";
import { is_doc_editable } from "../../../../utils/is-doc-editable";
import { is_doc_loading } from "../../../../utils/is-doc-loading";
import toolbar_styles from "../../toolbar.module.scss";
import CodeBlockMenuItem from "./code-block";
import EmbedMenuItem from "./embed";
import EmojiMenuItem from "./emoji";
import HorizontalRuleMenuItem from "./horizontal-rule";
import ImageMenuItem from "./image";
import SymbolMenuItem from "./symbol";

const ToolbarInsertItem = (): React.ReactElement => {
  const doc_status = use_atom_value(doc_status_atom);
  const document_loading = is_doc_loading(doc_status);

  return (
    <Menu
      slot_props={{
        content: {
          side: "top"
        }
      }}
      trigger={
        // TODO: Add tooltip once `data-state` clash resolves
        <IconButton
          aria-label={"Insert"}
          className={clsx(
            css["focus-invert"],
            toolbar_styles.x,
            toolbar_styles.button
          )}
          disabled={document_loading}
          size={"lg"}
          title={"Insert"}
          variant={"ghost"}
        >
          <PlusIcon />
        </IconButton>
      }
    >
      <HorizontalRuleMenuItem />
      <ImageMenuItem />
      <CodeBlockMenuItem />
      <EmbedMenuItem />
      <EmojiMenuItem />
      <SymbolMenuItem />
    </Menu>
  );
};

export default ToolbarInsertItem;
