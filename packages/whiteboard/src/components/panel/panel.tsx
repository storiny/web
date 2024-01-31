import clsx from "clsx";
import { useAtomValue as use_atom_value } from "jotai";
import React from "react";
import {
  Panel as PanelPrimitive,
  PanelGroup,
  PanelResizeHandle
} from "react-resizable-panels";

import ScrollArea from "~/components/scroll-area";
import { use_scrollbar_visibility } from "~/hooks/use-scrollbar-visibility";
import css from "~/theme/main.module.scss";

import { is_pen_mode_atom } from "../../atoms";
import { use_active_object, use_canvas } from "../../hooks";
import Layers from "../layers";
import CanvasTools from "./canvas";
import DrawTools from "./draw";
import styles from "./panel.module.scss";

// Tools

const ToolsPanel = (): React.ReactElement => {
  const canvas = use_canvas();
  const active_object = use_active_object();
  const is_pen_mode = use_atom_value(is_pen_mode_atom);
  const { ref, visible } = use_scrollbar_visibility<HTMLDivElement>();

  return (
    <ScrollArea
      className={css["full-h"]}
      slot_props={{
        viewport: {
          ref,
          style: {
            // eslint-disable-next-line prefer-snakecase/prefer-snakecase
            paddingRight: visible ? "10px" : 0
          }
        },
        scrollbar: { className: clsx(styles.x, styles.scrollbar) }
      }}
      type={"auto"}
    >
      <div
        className={styles["tools-wrapper"]}
        style={
          {
            "--scrollbar-width": visible ? "10px" : "0px"
          } as React.CSSProperties
        }
      >
        {active_object ||
        is_pen_mode ||
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
  <div className={styles.panel}>
    <PanelGroup direction={"vertical"}>
      <PanelPrimitive>
        <ToolsPanel />
      </PanelPrimitive>
      <PanelResizeHandle
        className={clsx(
          css["focusable"],
          css["flex-center"],
          styles.x,
          styles.resizer
        )}
      >
        <svg aria-hidden className={styles.dots} viewBox="0 0 10 2">
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
