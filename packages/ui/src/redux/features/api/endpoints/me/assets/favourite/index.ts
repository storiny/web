import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/assets/${id}/favourite`;

export interface AssetFavouriteResponse {}
export interface AssetFavouritePayload {
  id: string;
  value: boolean;
}

export const { useFavouriteAssetMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    favouriteAsset: builder.mutation<
      AssetFavouriteResponse,
      AssetFavouritePayload
    >({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: body.value ? "POST" : "DELETE"
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Asset", id: arg.id }]
    })
  })
});
