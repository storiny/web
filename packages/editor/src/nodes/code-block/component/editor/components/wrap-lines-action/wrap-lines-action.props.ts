import { Compartment } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import React from "react";

export interface WrapLinesActionProps {
  /**
   * The editor view ref
   */
  view_ref: React.RefObject<EditorView | null>;
  /**
   * The wrap compartment
   */
  wrap_compartment: Compartment;
}
