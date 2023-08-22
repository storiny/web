import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { API_VERSION } from "@storiny/shared";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/v${API_VERSION}`
  }),
  tagTypes: ["Notification", "Asset", "Story", "Comment", "Reply"],
  endpoints: () => ({})
});
