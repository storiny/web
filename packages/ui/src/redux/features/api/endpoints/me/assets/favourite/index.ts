import { ApiQueryBuilder } from "~/redux/features/api/types";

const SEGMENT = (id: string): string => `me/assets/${id}/favourite`;

export type AssetFavouriteResponse = void;
export interface AssetFavouritePayload {
  id: string;
  value: boolean;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const assetFavourite = (builder: ApiQueryBuilder) =>
  builder.mutation<AssetFavouriteResponse, AssetFavouritePayload>({
    query: (body) => ({
      url: `/${SEGMENT(body.id)}`,
      method: body.value ? "POST" : "DELETE"
    }),
    invalidatesTags: (result, error, arg) => [{ type: "Asset", id: arg.id }]
  });
