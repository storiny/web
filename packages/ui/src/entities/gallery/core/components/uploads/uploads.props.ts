export interface UploadsProps {
  /**
   * Disables whiteboard prompt (for smaller screens)
   */
  disable_whiteboard_prompt?: boolean;
  /**
   * Callback called when the user wants the image to open
   * in the whiteboard
   * @param blob_url Image blob URL
   */
  on_open_in_whiteboard?: (blob_url: string) => void;
}
