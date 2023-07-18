import React from "react";

import { RootState } from "../../store";
import {
  BinaryFiles,
  ClipboardData,
  Gesture,
  ImportedDataState,
  Layer,
  NonDeletedLayer,
  PointerDownState
} from "../../types";

export interface ImageEditorProps
  extends Omit<
    React.ComponentPropsWithoutRef<"div">,
    "onPaste" | "onChange" | "onPointerDown"
  > {
  initialState?: ImportedDataState | null | Promise<ImportedDataState | null>;
  onChange?: (
    layers: readonly Layer[],
    editorState: RootState,
    files: BinaryFiles
  ) => void;
  onLinkOpen?: (
    layer: NonDeletedLayer,
    event: CustomEvent<{
      nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasLayer>;
    }>
  ) => void;
  onPaste?: (
    data: ClipboardData,
    event: ClipboardEvent | null
  ) => Promise<boolean> | boolean;
  onPointerDown?: (
    activeTool: RootState["activeTool"],
    pointerDownState: PointerDownState
  ) => void;
  onPointerUpdate?: (payload: {
    button: "down" | "up";
    pointer: { x: number; y: number };
    pointersMap: Gesture["pointers"];
  }) => void;
  onScrollChange?: (scrollX: number, scrollY: number) => void;
}
