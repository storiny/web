import { ContentType } from "@storiny/shared";
import { NewsletterSubscribeSchema } from "@storiny/web/src/app/blog/[identifier]/newsletter/schema";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (blog_id: string): string => `blogs/${blog_id}/subscribe`;

export interface AddNewsletterSubscriptionPayload
  extends NewsletterSubscribeSchema {
  blog_id: string;
}

export const {
  useAddNewsletterSubscriptionMutation: use_add_newsletter_subscription_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    addNewsletterSubscription: builder.mutation<
      void,
      AddNewsletterSubscriptionPayload
    >({
      query: ({ blog_id, email }) => ({
        url: `/${SEGMENT(blog_id)}`,
        method: "POST",
        body: { email },
        headers: {
          "Content-type": ContentType.JSON
        }
      })
    })
  })
});
