import { Shape } from "../../../constants";
import { EditorState } from "../../../types";

/**
 * Predicate function for determining whether the hand tool is active
 * @param activeTool Active tool
 */
export const isHandToolActive = ({
  activeTool
}: {
  activeTool: EditorState["activeTool"];
}): boolean => activeTool.type === Shape.HAND;
