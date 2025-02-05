import { Label } from "radix-ui";

export interface LabelProps extends Label.LabelProps {
  /**
   * If `true`, renders with a muted color
   * @default false
   */
  disabled?: boolean;
  /**
   * If `true`, renders an asterisk after the children
   * @default false
   */
  required?: boolean;
}
