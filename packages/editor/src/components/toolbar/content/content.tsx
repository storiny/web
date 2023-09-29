"use client";

import { clsx } from "clsx";
import { useSetAtom } from "jotai";
import React from "react";

import Divider from "../../../../../ui/src/components/divider";
import Grow from "../../../../../ui/src/components/grow";
import IconButton from "../../../../../ui/src/components/icon-button";
import ScrollArea from "../../../../../ui/src/components/scroll-area";
import Tooltip from "../../../../../ui/src/components/tooltip";
import { use_media_query } from "../../../../../ui/src/hooks/use-media-query";
import SidebarExpandIcon from "~/icons/SidebarExpand";
import { BREAKPOINTS } from "~/theme/breakpoints";

import { sidebarsCollapsedAtom } from "../../../atoms";
import toolbarStyles from "../toolbar.module.scss";
import ToolbarAlignmentItem from "./alignment";
import styles from "./content.module.scss";
import ToolbarHistoryItem from "./history";
import ToolbarInsertItem from "./insert";
import ToolbarTextStyleItem from "./text-style";

const SuspendedEditorToolbarContent = (): React.ReactElement => {
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  const setSidebarsCollapsed = use_set_atom(sidebarsCollapsedAtom);

  return (
    <ScrollArea
      className={"f-grow"}
      enable_horizontal
      slot_props={{
        scrollbar: {
          style: { background: "none", "--size": "8px" } as React.CSSProperties
        },
        thumb: {
          className: clsx(styles.x, styles.thumb)
        }
      }}
    >
      <div className={clsx("flex-center", styles.x, styles.content)}>
        {is_smaller_than_desktop ? (
          <ToolbarHistoryItem />
        ) : (
          <Tooltip content={"Expand sidebars"}>
            <IconButton
              className={clsx(
                "focus-invert",
                toolbarStyles.x,
                toolbarStyles.button
              )}
              onClick={(): void => setSidebarsCollapsed(false)}
              size={"lg"}
              variant={"ghost"}
            >
              <SidebarExpandIcon />
            </IconButton>
          </Tooltip>
        )}
        <Divider orientation={"vertical"} />
        <ToolbarTextStyleItem />
        {is_smaller_than_mobile && <Grow />}
        <Divider orientation={"vertical"} />
        <ToolbarInsertItem />
        <Divider orientation={"vertical"} />
        <ToolbarAlignmentItem />
      </div>
    </ScrollArea>
  );
};

export default SuspendedEditorToolbarContent;
