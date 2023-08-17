import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Use latest
const API_VERSION = 1;

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/v${API_VERSION}`
  }),
  tagTypes: ["Notification", "Asset", "Story"],
  endpoints: () => ({})
});
