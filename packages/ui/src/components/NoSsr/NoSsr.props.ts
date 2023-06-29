import React from "react";

export interface NoSsrProps {
  /**
   * Children.
   */
  children?: React.ReactNode;
  /**
   * Enables SSR if `true`.
   */
  disabled?: boolean;
  /**
   * The fallback content to display.
   * @default null
   */
  fallback?: React.ReactNode;
}
