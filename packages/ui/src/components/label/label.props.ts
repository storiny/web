import { LabelProps as LabelPrimitiveProps } from "@radix-ui/react-label";

export interface LabelProps extends LabelPrimitiveProps {
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
