import { clsx } from "clsx";
import React from "react";

import IconButton from "~/components/IconButton";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Tooltip from "~/components/Tooltip";
import CodeBlockIcon from "~/icons/CodeBlock";
import EmbedIcon from "~/icons/Embed";
import HorizontalRuleIcon from "~/icons/HorizontalRule";
import ImageIcon from "~/icons/Image";
import MoodSmileIcon from "~/icons/MoodSmile";
import OmegaIcon from "~/icons/Omega";
import PlusIcon from "~/icons/Plus";

import toolbarStyles from "../../toolbar.module.scss";

const ToolbarInsertItem = (): React.ReactElement => (
  <Menu
    slotProps={{
      content: {
        side: "top"
      }
    }}
    trigger={
      <div>
        <Tooltip content={"Insert"}>
          <IconButton
            className={clsx(
              "focus-invert",
              toolbarStyles.x,
              toolbarStyles.button
            )}
            size={"lg"}
            variant={"ghost"}
          >
            <PlusIcon />
          </IconButton>
        </Tooltip>
      </div>
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

export default ToolbarInsertItem;
