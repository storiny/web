import { IconButtonProps } from "src/components/icon-button";
import { TextareaProps } from "src/components/textarea";

export interface ResponseTextareaProps extends TextareaProps {
  /**
   * If `true`, hides the post icon button
   * @default false
   */
  hide_post_button?: boolean;
  /**
   * Props passed to the post icon button
   */
  post_button_props?: IconButtonProps;
}
