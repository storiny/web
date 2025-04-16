import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/assets/${id}/alt`;

export interface AssetAltPayload {
  alt: string;
  id: string;
}

export const { useAssetAltMutation: use_asset_alt_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      assetAlt: builder.mutation<void, AssetAltPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "PATCH",
          body: {
            alt: body.alt
          },
          headers: {
            "Content-type": ContentType.JSON
          }
        }),
        invalidatesTags: (_result, _error, arg) => [
          { type: "Asset", id: arg.id }
        ]
      })
    })
  });
