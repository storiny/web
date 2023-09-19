import { Story } from "@storiny/types";

export interface EditorProps {
  /**
   * ID of the document
   */
  docId: string;
  /**
   * Initial document data
   */
  initialDoc?: Uint8Array;
  /**
   * Whether to render a read-only editor
   * @default false
   */
  readOnly?: boolean;
  /**
   * Role of the user
   */
  role: "editor" | "viewer";
  /**
   * The story object
   */
  story: Story;
}
