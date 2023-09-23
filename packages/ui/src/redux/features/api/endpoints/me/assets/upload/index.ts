import { Asset } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/assets";

export type AssetUploadResponse = Asset;
export interface AssetUploadPayload {
  alt: string;
  file: File;
}

export const { useUploadAssetMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
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
