import React from "react";

export interface ModalFooterProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * If `true`, renders the compact version
   */
  compact?: boolean;
}
