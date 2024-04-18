import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string => `me/newsletters/${blog_id}`;

export interface UpdateNewsletterSubscriptionPayload {
  action: "subscribe" | "unsubscribe";
  blog_id: string;
}

export const {
  useUpdateNewsletterSubscriptionMutation:
    use_update_newsletter_subscription_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    updateNewsletterSubscription: builder.mutation<
      void,
      UpdateNewsletterSubscriptionPayload
    >({
      query: ({ blog_id, action }) => ({
        url: `/${SEGMENT(blog_id)}`,
        method: action === "subscribe" ? "POST" : "DELETE"
      })
    })
  })
});
