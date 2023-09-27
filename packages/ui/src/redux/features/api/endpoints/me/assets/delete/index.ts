import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/assets/${id}`;

export interface AssetDeletePayload {
  id: string;
}

export const { useDeleteAssetMutation: use_delete_asset_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      deleteAsset: builder.mutation<void, AssetDeletePayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "DELETE"
        }),
        invalidatesTags: (result, error, arg) => [{ type: "Asset", id: arg.id }]
      })
    })
  });
