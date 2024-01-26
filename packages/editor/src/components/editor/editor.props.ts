import { DocUserRole, Story } from "@storiny/types";

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
   * Whether the current user is the writer of the story
   */
  is_writer?: boolean;
  /**
   * Whether to render a read-only editor
   * @default false
   */
  read_only?: boolean;
  /**
   * Role of the user
   */
  role: DocUserRole;
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
