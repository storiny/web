import { ResponseTextareaProps } from "~/entities/ResponseTextarea";

export interface ResponseEditorProps {
  /**
   * ID of the response entity
   */
  responseId: string;
  /**
   * Props passed to the response textarea
   */
  responseTextareaProps?: ResponseTextareaProps;
  /**
   * Response type
   */
  responseType: "comment" | "reply";
}
