import { EditorView } from "@codemirror/view";
import React from "react";

export interface CopyCodeActionProps {
  /**
   * The editor view ref
   */
  view_ref: React.RefObject<EditorView | null>;
}
