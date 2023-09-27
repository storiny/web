"use client";

import { clsx } from "clsx";
import { useSetAtom } from "jotai";
import React from "react";

import Divider from "~/components/Divider";
import Grow from "~/components/Grow";
import IconButton from "~/components/IconButton";
import ScrollArea from "~/components/ScrollArea";
import Tooltip from "~/components/Tooltip";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import SidebarExpandIcon from "~/icons/SidebarExpand";
import { breakpoints } from "~/theme/breakpoints";

import { sidebarsCollapsedAtom } from "../../../atoms";
import toolbarStyles from "../toolbar.module.scss";
import ToolbarAlignmentItem from "./alignment";
import styles from "./content.module.scss";
import ToolbarHistoryItem from "./history";
import ToolbarInsertItem from "./insert";
import ToolbarTextStyleItem from "./text-style";

const SuspendedEditorToolbarContent = (): React.ReactElement => {
  const isSmallerThanMobile = useMediaQuery(breakpoints.down("mobile"));
  const isSmallerThanDesktop = useMediaQuery(breakpoints.down("desktop"));
  const setSidebarsCollapsed = useSetAtom(sidebarsCollapsedAtom);

  return (
    <ScrollArea
      className={"f-grow"}
      enableHorizontal
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
        {isSmallerThanDesktop ? (
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
        {isSmallerThanMobile && <Grow />}
        <Divider orientation={"vertical"} />
        <ToolbarInsertItem />
        <Divider orientation={"vertical"} />
        <ToolbarAlignmentItem />
      </div>
    </ScrollArea>
  );
};

export default SuspendedEditorToolbarContent;
