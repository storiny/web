import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import IconButton from "~/components/IconButton";
import Menu from "~/components/Menu";
import PlusIcon from "~/icons/Plus";

import { documentLoadingAtom } from "../../../../atoms";
import toolbarStyles from "../../toolbar.module.scss";
import CodeBlockMenuItem from "./code-block";
import EmbedMenuItem from "./embed";
import EmojiMenuItem from "./emoji";
import HorizontalRuleMenuItem from "./horizontal-rule";
import ImageMenuItem from "./image";
import SpecialCharacterMenuItem from "./special-character";

const ToolbarInsertItem = (): React.ReactElement => {
  const documentLoading = useAtomValue(documentLoadingAtom);
  return (
    <Menu
      slotProps={{
        content: {
          side: "top"
        }
      }}
      trigger={
        // TODO: Add tooltip once `data-state` clash resolves
        <IconButton
          aria-label={"Insert"}
          className={clsx(
            "focus-invert",
            toolbarStyles.x,
            toolbarStyles.button
          )}
          disabled={documentLoading}
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
      <SpecialCharacterMenuItem />
    </Menu>
  );
};

export default ToolbarInsertItem;
