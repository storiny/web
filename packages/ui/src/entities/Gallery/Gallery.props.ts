import React from "react";

import { SelectedAtomValue } from "./core/atoms";

export interface GalleryProps {
  /**
   * Trigger child
   */
  children?: React.ReactNode;
  /**
   * Cancel callback
   */
  onCancel?: () => void;
  /**
   * Confirm callback
   * @param asset Confirmed asset
   */
  onConfirm?: (asset: NonNullable<SelectedAtomValue>) => void;
}
