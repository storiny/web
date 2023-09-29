import { ResponseTextareaProps } from "src/entities/response-textarea";

export interface ResponseEditorProps {
  /**
   * ID of the response entity
   */
  response_id: string;
  /**
   * Props passed to the response textarea
   */
  response_textarea_props?: ResponseTextareaProps;
  /**
   * Response type
   */
  response_type: "comment" | "reply";
}
