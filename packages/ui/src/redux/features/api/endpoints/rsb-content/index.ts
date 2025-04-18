import { Story, Tag, User } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "rsb-content";

export interface GetRightSidebarContentResponse {
  stories: Story[];
  tags: Tag[];
  users: User[];
}

export const {
  useGetRightSidebarContentQuery: use_get_right_sidebar_content_query
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    getRightSidebarContent: builder.query<GetRightSidebarContentResponse, void>(
      { query: () => `/${SEGMENT}` }
    )
  })
});
