import { Asset } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/assets";

export type AssetUploadResponse = Asset;
export interface AssetUploadPayload {
  alt: string;
  file: File;
}

export const { useUploadAssetMutation: use_upload_asset_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      uploadAsset: builder.mutation<AssetUploadResponse, AssetUploadPayload>({
        query: ({ alt, file }) => {
          const body = new FormData();
          body.append("Content-Type", file.type);
          body.append("file", file);
          body.append("alt", alt);

          return {
            url: `/${SEGMENT}`,
            method: "POST",
            body
          };
        },
        invalidatesTags: ["Asset"]
      })
    })
  });
