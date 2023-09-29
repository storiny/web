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
  on_cancel?: () => void;
  /**
   * Confirm callback
   * @param asset Confirmed asset
   */
  on_confirm?: (asset: {
    alt: string;
    credits?: { author: string; url: string };
    height: number;
    hex: string;
    key: string;
    rating: AssetRating;
    width: number;
  }) => void;
}
