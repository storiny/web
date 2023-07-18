import { cleanEditorStateForExport } from "../../lib";
import { BinaryFiles } from "../binary";
import { Layer } from "../layer";

export interface ExportedDataState {
  editorState: ReturnType<typeof cleanEditorStateForExport>;
  files: BinaryFiles | undefined;
  layers: readonly Layer[];
  source: string;
  type: string;
  version: number;
}
