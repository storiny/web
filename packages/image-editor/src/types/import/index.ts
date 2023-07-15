import { BinaryFiles } from "../binary";
import { Layer } from "../layer";
import { RootState } from "../state";

export interface ImportedDataState {
  editorState?: Partial<RootState> | null;
  files?: BinaryFiles;
  layers?: readonly Layer[] | null;
  source?: string;
  type?: string;
  version?: number;
}
