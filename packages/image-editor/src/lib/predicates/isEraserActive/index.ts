import { Shape } from "../../../constants";
import { EditorState } from "../../../types";

/**
 * Predicate function for determining whether the eraser tool is active
 * @param activeTool Active tool
 */
export const isEraserActive = ({
  activeTool
}: {
  activeTool: EditorState["activeTool"];
}): boolean => activeTool.type === Shape.ERASER;
