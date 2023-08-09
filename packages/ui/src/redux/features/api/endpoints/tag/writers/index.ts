import { User } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (tagName: string): string => `tag/${tagName}/writers`;

export type GetTagWritersResponse = User[];

export const { useGetTagWritersQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTagWriters: builder.query<GetTagWritersResponse, { tagName: string }>({
      query: ({ tagName }) => `/${SEGMENT(tagName)}`
    })
  })
});
