import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/assets/${id}/alt`;

export interface AssetAltResponse {}
export interface AssetAltPayload {
  alt: string;
  id: string;
}

export const { useAssetAltMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    assetAlt: builder.mutation<AssetAltResponse, AssetAltPayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST",
        body: {
          alt: body.alt
        },
        headers: {
          "Content-type": ContentType.JSON
        }
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Asset", id: arg.id }]
    })
  })
});
