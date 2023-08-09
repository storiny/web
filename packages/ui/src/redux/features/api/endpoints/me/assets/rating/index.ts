import { AssetRating, ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/assets/${id}/rating`;

export interface AssetRatingResponse {}
export interface AssetRatingPayload {
  id: string;
  rating: AssetRating;
}

export const { useAssetRatingMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    assetRating: builder.mutation<AssetRatingResponse, AssetRatingPayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST",
        body: {
          rating: body.rating
        },
        headers: {
          "Content-type": ContentType.JSON
        }
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Asset", id: arg.id }]
    })
  })
});
