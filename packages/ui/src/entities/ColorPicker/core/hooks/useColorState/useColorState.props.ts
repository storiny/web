import { TColor } from "../../types";

export interface UseColorStateProps {
  /**
   * Uncontrolled default color value
   */
  defaultValue?: TColor;
  /**
   * Callback function called when the color value changes
   * @param value Next color value
   */
  onChange?: (value: TColor) => void;
  /**
   * Controlled color value
   */
  value?: TColor;
}
