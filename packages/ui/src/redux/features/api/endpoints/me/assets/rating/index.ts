import { AssetRating, ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/assets/${id}/rating`;

export interface AssetRatingPayload {
  id: string;
  rating: AssetRating;
}

export const { useAssetRatingMutation: use_asset_rating_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      assetRating: builder.mutation<void, AssetRatingPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "PATCH",
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
