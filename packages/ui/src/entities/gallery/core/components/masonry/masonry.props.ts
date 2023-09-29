import { Asset } from "@storiny/types";

export interface GalleryMasonryProps {
  /**
   * Callback called when a Pexels image has finished uploading
   * @param asset New asset
   */
  on_pexels_upload_finish?: (asset: Asset) => void;
  /**
   * Gallery tab value
   */
  tab: "pexels" | "library";
}
