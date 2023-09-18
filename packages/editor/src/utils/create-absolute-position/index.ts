import {
  AbsolutePosition,
  createAbsolutePositionFromRelativePosition,
  RelativePosition
} from "yjs";

import { Binding } from "../../collaboration/bindings";

/**
 * Creates absolute position from relative position
 * @param relativePosition Relative position
 * @param binding Binding
 */
export const createAbsolutePosition = (
  relativePosition: RelativePosition,
  binding: Binding
): AbsolutePosition | null =>
  createAbsolutePositionFromRelativePosition(relativePosition, binding.doc);
