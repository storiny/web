import {
  AbsolutePosition,
  createAbsolutePositionFromRelativePosition as create_absolute_position_from_relative_position,
  RelativePosition
} from "yjs";

import { Binding } from "../../collaboration/bindings";

/**
 * Creates absolute position from relative position
 * @param relative_position Relative position
 * @param binding Binding
 */
export const create_absolute_position = (
  relative_position: RelativePosition,
  binding: Binding
): AbsolutePosition | null =>
  create_absolute_position_from_relative_position(
    relative_position,
    binding.doc
  );
