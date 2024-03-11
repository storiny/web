import {
  createApi as create_api,
  fetchBaseQuery as fetch_base_query
} from "@reduxjs/toolkit/query/react";
import { API_VERSION } from "@storiny/shared";

export const api_slice = create_api({
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  reducerPath: "api",
  baseQuery: fetch_base_query({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/v${API_VERSION}`,
    credentials: "include"
  }),
  tagTypes: [
    "Notification",
    "Asset",
    "Story",
    "Comment",
    "Reply",
    "Blog",
    "BlogRequest",
    "FriendRequest",
    "CollaborationRequest",
    "BlogEditorRequest",
    "BlogWriterRequest"
  ],
  endpoints: () => ({})
  /* eslint-enable prefer-snakecase/prefer-snakecase */
});
