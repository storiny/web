import { Compartment } from "@codemirror/state";
import { EditorView } from "@codemirror/view";

export interface WrapLinesActionProps {
  /**
   * The editor view
   */
  view: EditorView | null;
  /**
   * The wrap compartment
   */
  wrap_compartment: Compartment;
}
