import React from "react";

export interface WhiteboardCoreProps {
  /**
   * Initial image URL to load on the mount. Used when the user clicks on
   * the `Open in whiteboard` button on the upload tab
   */
  initialImageUrl?: string | null;
  /**
   * Cancel callback
   */
  onCancel?: () => void;
  /**
   * Confirm callback, invoked when the user has finished sketching
   * @param file Output file blob
   * @param alt Alt text for the sketch
   */
  onConfirm?: (file: File, alt: string) => void;
  /**
   * Mount callback
   */
  onMount?: () => void;
}

export type WhiteboardProps = React.ComponentPropsWithoutRef<"div"> &
  WhiteboardCoreProps;
