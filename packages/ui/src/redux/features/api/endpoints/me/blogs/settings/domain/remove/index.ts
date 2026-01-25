import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string =>
  `me/blogs/${blog_id}/settings/domain`;

export interface RemoveBlogDomainPayload {
  blog_id: string;
}

export const { useRemoveBlogDomainMutation: use_remove_blog_domain_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      removeBlogDomain: builder.mutation<void, RemoveBlogDomainPayload>({
        query: ({ blog_id }) => ({
          url: `/${SEGMENT(blog_id)}`,
          method: "DELETE"
        })
      })
    })
  });
