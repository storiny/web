import { Photos } from "pexels";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/gallery";
const ITEMS_PER_PAGE = 15;

export type GetGalleryPhotosResponse = Photos["photos"];

export const { useGetGalleryPhotosQuery: use_get_gallery_photos_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getGalleryPhotos: builder.query<
        { has_more: boolean; items: Photos["photos"] },
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
          has_more: response.length === ITEMS_PER_PAGE
        }),
        merge: (current_cache, data) => {
          const new_items = data.items.filter(
            (data_item) =>
              !current_cache.items.some((item) => data_item.id === item.id)
          );

          current_cache.items.push(...new_items);
          current_cache.has_more = new_items.length === ITEMS_PER_PAGE;
        },
        forceRefetch: ({ currentArg, previousArg }) =>
          currentArg?.page !== previousArg?.page ||
          currentArg?.query !== previousArg?.query
      })
    })
  });
