import { RefObject } from "react";

import { ColorState } from "../../types";

export interface UseColorBoardProps {
  ariaDescription?: string;
  ariaLabel?: string;
  ariaValueFormat?: string;
  /**
   * Board ref
   */
  ref: RefObject<HTMLElement>;
  /**
   * Color state
   */
  state: ColorState;
}
