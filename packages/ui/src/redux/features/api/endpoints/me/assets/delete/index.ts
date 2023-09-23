import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/assets/${id}`;

export interface AssetDeleteResponse {}
export interface AssetDeletePayload {
  id: string;
}

export const { useDeleteAssetMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    deleteAsset: builder.mutation<AssetDeleteResponse, AssetDeletePayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "DELETE"
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Asset", id: arg.id }]
    })
  })
});
