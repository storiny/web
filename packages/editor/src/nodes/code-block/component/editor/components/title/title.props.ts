import { NodeKey } from "lexical";

export interface CodeBlockTitleProps {
  /**
   * The key of the code block node
   */
  node_key: NodeKey;
  /**
   * The read-only flag
   */
  read_only: boolean;
  /**
   * The title of the code block
   */
  title: string;
}
