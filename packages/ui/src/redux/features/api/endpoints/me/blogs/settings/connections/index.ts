import { ContentType } from "@storiny/shared";
import { BlogConnectionsSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/blogs/[id_or_slug]/(default-rsb)/settings/connections/connections.schema";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/blogs/${id}/settings/connections`;

export type BlogConnectionsPayload = BlogConnectionsSchema & {
  blog_id: string;
};

export const { useBlogConnectionsMutation: use_blog_connections_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      blogConnections: builder.mutation<void, BlogConnectionsPayload>({
        query: ({ blog_id, ...body }) => ({
          url: `/${SEGMENT(blog_id)}`,
          method: "PATCH",
          body,
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
