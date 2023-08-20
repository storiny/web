import { IconButtonProps } from "~/components/IconButton";
import { TextareaProps } from "~/components/Textarea";

export interface ResponseTextareaProps extends TextareaProps {
  /**
   * If `true`, hides the post icon button
   * @default false
   */
  hidePostButton?: boolean;
  /**
   * Props passed to the post icon button
   */
  postButtonProps?: IconButtonProps;
}
