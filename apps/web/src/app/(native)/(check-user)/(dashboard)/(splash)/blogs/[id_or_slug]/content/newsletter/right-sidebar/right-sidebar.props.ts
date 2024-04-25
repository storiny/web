import { BlogNewsletterProps } from "../newsletter.props";

export type NewsletterRightSidebarProps = Pick<
  BlogNewsletterProps,
  "subscriber_count"
>;
