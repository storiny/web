import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import React from "react";

import IconButton from "~/components/IconButton";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import CodeBlockIcon from "~/icons/CodeBlock";
import EmbedIcon from "~/icons/Embed";
import HorizontalRuleIcon from "~/icons/HorizontalRule";
import ImageIcon from "~/icons/Image";
import MoodSmileIcon from "~/icons/MoodSmile";
import OmegaIcon from "~/icons/Omega";
import PlusIcon from "~/icons/Plus";

import { documentLoadingAtom } from "../../../../atoms";
import toolbarStyles from "../../toolbar.module.scss";

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
      <MenuItem decorator={<HorizontalRuleIcon />}>Horizontal rule</MenuItem>
      <MenuItem decorator={<ImageIcon />}>Image</MenuItem>
      <MenuItem decorator={<CodeBlockIcon />}>Code block</MenuItem>
      <MenuItem decorator={<EmbedIcon />}>Embed</MenuItem>
      <MenuItem decorator={<MoodSmileIcon />}>Emoji</MenuItem>
      <MenuItem decorator={<OmegaIcon />}>Special character</MenuItem>
    </Menu>
  );
};

export default ToolbarInsertItem;
