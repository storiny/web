import { Photos } from "pexels";

import { ApiQueryBuilder } from "~/redux/features/api/types";

const SEGMENT = "public/gallery";
const ITEMS_PER_PAGE = 24;

export type GetGalleyPhotosResponse = Photos["photos"];

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const getGalleryPhotos = (builder: ApiQueryBuilder) =>
  builder.query<
    { hasMore: boolean; items: Photos["photos"] },
    { page: number; query?: string }
  >({
    query: ({ page, query }) =>
      `/${SEGMENT}?page=${page}${
        query ? `&query=${encodeURIComponent(query)}` : ""
      }`,
    serializeQueryArgs: ({ endpointName, queryArgs }) =>
      `${endpointName}:${queryArgs.query}`,
    transformResponse: (response: Photos["photos"]) => ({
      items: response,
      hasMore: response.length === ITEMS_PER_PAGE
    }),
    merge: (currentCache, newItems) => {
      currentCache.items.push(
        ...newItems.items.filter(
          (item) =>
            !currentCache.items.some((cacheItem) => cacheItem.id === item.id)
        )
      );
    },
    forceRefetch: ({ currentArg, previousArg }) =>
      currentArg?.page !== previousArg?.page ||
      currentArg?.query !== previousArg?.query
  });
