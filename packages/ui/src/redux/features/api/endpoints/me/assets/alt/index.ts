import { ContentType } from "@storiny/shared";

import { ApiQueryBuilder } from "~/redux/features/api/types";

const SEGMENT = (id: string): string => `me/assets/${id}/alt`;

export type AssetAltResponse = void;
export interface AssetAltPayload {
  alt: string;
  id: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const assetAlt = (builder: ApiQueryBuilder) =>
  builder.mutation<AssetAltResponse, AssetAltPayload>({
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
  });
