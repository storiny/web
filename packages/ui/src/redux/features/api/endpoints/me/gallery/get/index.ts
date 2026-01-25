import { Photos } from "pexels";

import { merge_fn } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/gallery";
const ITEMS_PER_PAGE = 30;

export type GetGalleryPhotosResponse = Photos["photos"];

export const {
  useLazyGetGalleryPhotosQuery: use_get_gallery_photos_query,
  endpoints: {
    getGalleryPhotos: { select: select_gallery_photos }
  }
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    getGalleryPhotos: builder.query<
      { has_more: boolean; items: Photos["photos"]; page: number },
      { page: number; query?: string }
    >({
      query: ({ page, query }) =>
        `/${SEGMENT}?page=${page}${
          query ? `&query=${encodeURIComponent(query)}` : ""
        }`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.query}`,
      transformResponse: (response: Photos["photos"], _, { page }) => ({
        page,
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (cache, data) => merge_fn(cache, data),
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.query !== previousArg?.query
    })
  })
});
