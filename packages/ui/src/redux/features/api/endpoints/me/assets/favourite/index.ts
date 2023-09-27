import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/assets/${id}/favourite`;

export interface AssetFavouritePayload {
  id: string;
  value: boolean;
}

export const { useFavouriteAssetMutation: use_favourite_asset_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      favouriteAsset: builder.mutation<void, AssetFavouritePayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: body.value ? "POST" : "DELETE"
        }),
        invalidatesTags: (result, error, arg) => [{ type: "Asset", id: arg.id }]
      })
    })
  });
