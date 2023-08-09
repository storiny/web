import { Story, Tag, User } from "@storiny/types";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "rsb-content";

export interface GetRightSidebarContentResponse {
  stories: Story[];
  tags: Tag[];
  users: User[];
}

export const { useGetRightSidebarContentQuery } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRightSidebarContent: builder.query<GetRightSidebarContentResponse, void>(
      {
        query: () => `/${SEGMENT}`
      }
    )
  })
});
