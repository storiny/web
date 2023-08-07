import { FileWithPreview } from "~/entities/Gallery/core/types";

export interface WhiteboardUploaderProps {
  /**
   * Alt text for the sketch file
   */
  alt: string;
  /**
   * Sketch file to upload
   */
  file: FileWithPreview;
  /**
   * Reset callback
   */
  onReset?: () => void;
}
