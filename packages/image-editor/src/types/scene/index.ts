import { ImportedDataState } from "../import";

export type SceneData = {
  commitToHistory?: boolean;
  editorState?: ImportedDataState["editorState"];
  layers?: ImportedDataState["layers"];
};
