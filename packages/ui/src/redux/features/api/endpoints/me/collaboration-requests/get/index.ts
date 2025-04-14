import { CollaborationRequest } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const ITEMS_PER_PAGE = 10;
const SEGMENT = "me/collaboration-requests";

export type GetCollaborationRequestsResponse = CollaborationRequest[];

export const get_collaboration_requests_api = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getCollaborationRequests: builder.query<
      { has_more: boolean; items: CollaborationRequest[] },
      {
        page: number;
        type: "received" | "sent";
      }
    >({
      query: ({ page, type }) => `/${SEGMENT}?page=${page}&type=${type}`,
      serializeQueryArgs: ({ endpointName, queryArgs }) =>
        `${endpointName}:${queryArgs.type}`,
      transformResponse: (response: CollaborationRequest[]) => ({
        items: response,
        has_more: response.length === ITEMS_PER_PAGE
      }),
      merge: (current_cache, data) => {
        const new_items = data.items.filter(
          (data_item) =>
            !current_cache.items.some((item) => data_item.id === item.id)
        );

        current_cache.items.push(...new_items);
        current_cache.has_more =
          current_cache.has_more && new_items.length === ITEMS_PER_PAGE;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.items.map(({ id }) => ({
                type: "CollaborationRequest" as const,
                id
              })),
              "CollaborationRequest"
            ]
          : ["CollaborationRequest"],
      forceRefetch: ({ currentArg, previousArg }) =>
        currentArg?.page !== previousArg?.page ||
        currentArg?.type !== previousArg?.type
    })
  })
});

export const {
  useGetCollaborationRequestsQuery: use_get_collaboration_requests_query
} = get_collaboration_requests_api;
