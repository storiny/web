export interface UploadsProps {
  /**
   * Disables whiteboard prompt (for smaller screens)
   */
  disableWhiteboardPrompt?: boolean;
  /**
   * Callback called when the user wants the image to open
   * in the whiteboard
   * @param blobUrl Image blob URL
   */
  onOpenInWhiteboard?: (blobUrl: string) => void;
}
