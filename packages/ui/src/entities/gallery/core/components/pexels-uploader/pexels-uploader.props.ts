import { Asset } from "@storiny/types";

export interface PexelsUploaderProps {
  /**
   * Callback called when the Pexels image has finished uploading
   * @param asset New asset
   */
  on_upload_finish: (asset: Asset) => void;
}
