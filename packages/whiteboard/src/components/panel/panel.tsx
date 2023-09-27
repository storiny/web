import clsx from "clsx";
import { useAtomValue } from "jotai";
import React from "react";
import {
  Panel as PanelPrimitive,
  PanelGroup,
  PanelResizeHandle
} from "react-resizable-panels";

import ScrollArea from "~/components/ScrollArea";
import { useScrollbarVisibility } from "~/hooks/useScrollbarVisibility";

import { isPenModeAtom } from "../../atoms";
import { useActiveObject, useCanvas } from "../../hooks";
import Layers from "../layers";
import CanvasTools from "./canvas";
import DrawTools from "./draw";
import styles from "./panel.module.scss";

// Tools

const ToolsPanel = (): React.ReactElement => {
  const canvas = useCanvas();
  const activeObject = useActiveObject();
  const isPenMode = useAtomValue(isPenModeAtom);
  const { ref, visible } = useScrollbarVisibility<HTMLDivElement>();
  // const tool = useAtomValue(toolAtom);
  // const isImageObjectActive = activeObject && isImageObject(activeObject);

  return (
    <ScrollArea
      className={"full-h"}
      slot_props={{
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
      <div
        className={clsx(styles.x, styles["tools-wrapper"])}
        style={
          {
            "--scrollbar-width": visible ? "10px" : "0px"
          } as React.CSSProperties
        }
      >
        {/* TODO: Implement */}
        {/*{tool === Tool.FILTERS && isImageObjectActive ? (*/}
        {/*  <FiltersTools key={activeObject?.get("id")} />*/}
        {/*) : (*/}
        {/*  <DrawTools />*/}
        {/*)}*/}
        {activeObject ||
        isPenMode ||
        canvas.current?.isDrawingMode ||
        canvas.current?.getActiveObjects().length ? (
          <DrawTools />
        ) : (
          <CanvasTools />
        )}
      </div>
    </ScrollArea>
  );
};

const Panel = (): React.ReactElement => (
  <div className={clsx(styles.x, styles.panel)}>
    <PanelGroup direction={"vertical"}>
      <PanelPrimitive>
        <ToolsPanel />
      </PanelPrimitive>
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
      <PanelPrimitive defaultSize={25}>
        <Layers />
      </PanelPrimitive>
    </PanelGroup>
  </div>
);

export default Panel;
