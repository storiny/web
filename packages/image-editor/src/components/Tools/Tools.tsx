import clsx from "clsx";
import React from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

import ScrollArea from "~/components/ScrollArea";

import AdjustTools from "./Adjust";
import styles from "./Tools.module.scss";

const Tools = (): React.ReactElement => (
  <div className={clsx(styles.x, styles.tools)}>
    <PanelGroup direction={"vertical"}>
      <Panel>
        <ScrollArea
          className={"full-h"}
          slotProps={{
            scrollbar: { className: clsx(styles.x, styles.scrollbar) }
          }}
        >
          <AdjustTools />
        </ScrollArea>
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
        <ScrollArea
          className={"full-h"}
          slotProps={{
            scrollbar: { className: clsx(styles.x, styles.scrollbar) }
          }}
        >
          Layers
        </ScrollArea>
      </Panel>
    </PanelGroup>
  </div>
);

export default Tools;
