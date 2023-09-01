import { AssetRating } from "@storiny/shared";
import React from "react";

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
  onConfirm?: (asset: {
    alt: string;
    height: number;
    hex: string;
    key: string;
    rating: AssetRating;
    width: number;
  }) => void;
}
