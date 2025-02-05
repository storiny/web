import { RefObject } from "react";

import { ColorState } from "../../types";

export interface UseColorBoardProps {
  aria_description?: string;
  aria_label?: string;
  aria_value_format?: string;
  /**
   * Board ref
   */
  ref: RefObject<HTMLElement | null>;
  /**
   * Color state
   */
  state: ColorState;
}
