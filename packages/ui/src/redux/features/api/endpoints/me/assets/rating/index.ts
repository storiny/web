import { AssetRating, ContentType } from "@storiny/shared";

import { ApiQueryBuilder } from "~/redux/features/api/types";

const SEGMENT = (id: string): string => `me/assets/${id}/rating`;

export type AssetRatingResponse = void;
export interface AssetRatingPayload {
  id: string;
  rating: AssetRating;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const assetRating = (builder: ApiQueryBuilder) =>
  builder.mutation<AssetRatingResponse, AssetRatingPayload>({
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
  });
