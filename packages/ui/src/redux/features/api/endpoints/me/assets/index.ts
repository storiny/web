import { Asset } from "@storiny/types";

import { ApiQueryBuilder } from "~/redux/features/api/types";

// Get

const GET_SEGMENT = "me/assets";
const ITEMS_PER_PAGE = 15;

export type GetUserAssetsResponse = Asset[];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getUserAssets = (builder: ApiQueryBuilder) =>
  builder.query<{ hasMore: boolean; items: Asset[] }, { page: number }>({
    query: ({ page }) => `/${GET_SEGMENT}?page=${page}`,
    transformResponse: (response: Asset[]) => ({
      items: response,
      hasMore: response.length === ITEMS_PER_PAGE
    }),
    serializeQueryArgs: ({ endpointName }) => endpointName,
    merge: (currentCache, newItems) => {
      currentCache.items.push(
        ...newItems.items.filter(
          (item) =>
            !currentCache.items.some((cacheItem) => cacheItem.id === item.id)
        )
      );
    },
    providesTags: (result) =>
      result
        ? [
            ...result.items.map(({ id }) => ({
              type: "Asset" as const,
              id
            })),
            "Asset"
          ]
        : ["Asset"],
    forceRefetch: ({ currentArg, previousArg }) =>
      currentArg?.page !== previousArg?.page
  });

// Post

const POST_SEGMENT = "me/assets";

export type AssetUploadResponse = Asset;
export interface AssetUploadPayload {
  alt: string;
  file: File;
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const assetUpload = (builder: ApiQueryBuilder) =>
  builder.mutation<AssetUploadResponse, AssetUploadPayload>({
    query: ({ alt, file }) => {
      const body = new FormData();
      body.append("Content-Type", file.type);
      body.append("file", file);
      body.append("alt", alt);

      return {
        url: `/${POST_SEGMENT}`,
        method: "POST",
        body
      };
    },
    invalidatesTags: ["Asset"]
  });

export * from "./alt";
export * from "./delete";
export * from "./favourite";
export * from "./rating";
