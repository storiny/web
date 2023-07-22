import clsx from "clsx";
import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import ScrollArea from "~/components/ScrollArea";
import ColorPicker from "~/entities/ColorPicker";
import { useScrollbarVisibility } from "~/hooks/useScrollbarVisibility";

import Layers from "../Layers";
import DrawTools from "./Draw";
import styles from "./Tools.module.scss";

// Tools

const ToolsPanel = (): React.ReactElement => {
  const { ref, visible } = useScrollbarVisibility<HTMLDivElement>();
  return (
    <ScrollArea
      className={"full-h"}
      slotProps={{
        viewport: {
          ref,
          style: {
            paddingRight: visible ? "10px" : 0
          }
        },
        scrollbar: { className: clsx(styles.x, styles.scrollbar) }
      }}
      type={"auto"}
    >
      <div style={{ maxWidth: "199px" }}>
        <DrawTools />
      </div>
    </ScrollArea>
  );
};

const Tools = (): React.ReactElement => (
  <div className={clsx(styles.x, styles.tools)}>
    <PanelGroup direction={"vertical"}>
      <Panel>
        <ToolsPanel />
      </Panel>
      <PanelResizeHandle
        className={clsx("focusable", "flex-center", styles.x, styles.resizer)}
      >
        <svg
          aria-hidden
          className={clsx(styles.x, styles.dots)}
          viewBox="0 0 10 2"
        >
          <path d="M2 1a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6 1a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM10 1a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
        </svg>
      </PanelResizeHandle>
      <Panel defaultSize={30}>
        <Layers />
      </Panel>
    </PanelGroup>
  </div>
);

export default Tools;
