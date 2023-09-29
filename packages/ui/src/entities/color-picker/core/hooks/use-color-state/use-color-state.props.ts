import { TColor } from "../../types";

export interface UseColorStateProps {
  /**
   * Uncontrolled default color value
   */
  default_value?: TColor;
  /**
   * Callback function called when the color value changes
   * @param value Next color value
   */
  on_change?: (value: TColor) => void;
  /**
   * Controlled color value
   */
  value?: TColor;
}
