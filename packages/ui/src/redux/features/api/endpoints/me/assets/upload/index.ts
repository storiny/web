import { Asset } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const POST_SEGMENT = "me/assets";

export type AssetUploadResponse = Asset;
export interface AssetUploadPayload {
  alt: string;
  file: File;
}

export const { useAssetUploadMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    assetUpload: builder.mutation<AssetUploadResponse, AssetUploadPayload>({
      query: ({ alt, file }) => {
        const body = new FormData();
        body.append("Content-Type", file.type);
        body.append("file", file);
        body.append("alt", alt);

        return {
          url: `/${POST_SEGMENT}`,
          method: "POST",
          body
        };
      },
      invalidatesTags: ["Asset"]
    })
  })
});
