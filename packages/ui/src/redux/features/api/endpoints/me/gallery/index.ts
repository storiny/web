import { Photos } from "pexels";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/gallery";
const ITEMS_PER_PAGE = 15;

export type GetGalleryPhotosResponse = Photos["photos"];

export const { useGetGalleryPhotosQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getGalleryPhotos: builder.query<
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
    })
  })
});
