export interface EditorProps {
  /**
   * ID of the document
   */
  docId: string;
  /**
   * Role of the user
   */
  role: "editor" | "viewer";
}
