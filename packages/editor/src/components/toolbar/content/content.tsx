"use client";

import { clsx } from "clsx";
import { useSetAtom as use_set_atom } from "jotai";
import React from "react";

import Divider from "~/components/divider";
import Grow from "~/components/grow";
import IconButton from "~/components/icon-button";
import ScrollArea from "~/components/scroll-area";
import Tooltip from "~/components/tooltip";
import { use_media_query } from "~/hooks/use-media-query";
import SidebarExpandIcon from "~/icons/sidebar-expand";
import { BREAKPOINTS } from "~/theme/breakpoints";

import { sidebars_collapsed_atom } from "../../../atoms";
import toolbar_styles from "../toolbar.module.scss";
import ToolbarAlignmentItem from "./alignment";
import styles from "./content.module.scss";
import ToolbarHistoryItem from "./history";
import ToolbarInsertItem from "./insert";
import ToolbarTextStyleItem from "./text-style";

const SuspendedEditorToolbarContent = (): React.ReactElement => {
  const is_smaller_than_mobile = use_media_query(BREAKPOINTS.down("mobile"));
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));
  const set_sidebars_collapsed = use_set_atom(sidebars_collapsed_atom);

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
                toolbar_styles.x,
                toolbar_styles.button
              )}
              onClick={(): void => set_sidebars_collapsed(false)}
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
