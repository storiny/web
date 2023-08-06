import React from "react";

export interface WhiteboardCoreProps {
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
}

export type WhiteboardProps = React.ComponentPropsWithoutRef<"div"> &
  WhiteboardCoreProps;
