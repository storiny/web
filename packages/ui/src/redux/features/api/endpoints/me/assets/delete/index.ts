import { ApiQueryBuilder } from "~/redux/features/api/types";

const SEGMENT = (id: string): string => `me/assets/${id}`;

export type AssetDeleteResponse = void;
export interface AssetDeletePayload {
  id: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const assetDelete = (builder: ApiQueryBuilder) =>
  builder.mutation<AssetDeleteResponse, AssetDeletePayload>({
    query: (body) => ({
      url: `/${SEGMENT(body.id)}`,
      method: "DELETE"
    }),
    invalidatesTags: (result, error, arg) => [{ type: "Asset", id: arg.id }]
  });
