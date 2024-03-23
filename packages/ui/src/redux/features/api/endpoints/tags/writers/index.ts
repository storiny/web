import { User } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (tag_name: string): string => `tags/${tag_name}/writers`;

export type GetTagWritersResponse = User[];

export const { useGetTagWritersQuery: use_get_tag_writers_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getTagWriters: builder.query<GetTagWritersResponse, { tag_name: string }>(
        {
          query: ({ tag_name }) => `/${SEGMENT(tag_name)}`
        }
      )
    })
  });
