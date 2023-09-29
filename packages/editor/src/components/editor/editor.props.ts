import { Story } from "@storiny/types";

export type StoryStatus = "draft" | "published" | "deleted";

export interface EditorProps {
  /**
   * ID of the document
   */
  doc_id: string;
  /**
   * Initial document data
   */
  initial_doc?: Uint8Array;
  /**
   * Whether to render a read-only editor
   * @default false
   */
  read_only?: boolean;
  /**
   * Role of the user
   */
  role: "editor" | "viewer";
  /**
   * Document status
   * @default 'draft'
   */
  status?: StoryStatus;
  /**
   * The story object
   */
  story: Story;
}
