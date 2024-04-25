import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string =>
  `me/blogs/${blog_id}/subscribers/import`;

export interface ImportSubscribersPayload {
  blog_id: string;
  data: string[];
}

export const { useImportSubscribersMutation: use_import_subscribers_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      importSubscribers: builder.mutation<void, ImportSubscribersPayload>({
        query: ({ blog_id, data }) => ({
          url: `/${SEGMENT(blog_id)}`,
          method: "POST",
          body: { data },
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
