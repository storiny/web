"use client";

import { clsx } from "clsx";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { use_media_query } from "~/hooks/use-media-query";
import { number_action } from "~/redux/features";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { BREAKPOINTS } from "~/theme/breakpoints";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import DashboardTitle from "../../../../common/dashboard-title";
import { BlogNewsletterProps } from "./newsletter.props";
import BlogContentNewsletterRightSidebar from "./right-sidebar";
import Subscribers from "./right-sidebar/subscribers";
import styles from "./styles.module.scss";

const SubscribersHeader = ({
  subscriber_count: subscriber_count_prop
}: BlogNewsletterProps): React.ReactElement => {
  const blog = use_blog_context();
  const dispatch = use_app_dispatch();
  const subscriber_count =
    use_app_selector(
      (state) => state.entities.blog_subscriber_counts[blog.id]
    ) || 0;

  React.useEffect(() => {
    dispatch(
      number_action("blog_subscriber_counts", blog.id, subscriber_count_prop)
    );
  }, [dispatch, blog, subscriber_count_prop]);

  return (
    <div
      className={clsx(
        css["full-bleed"],
        css["dashboard-header"],
        css["flex-center"],
        styles["subscribers-header"]
      )}
      style={{ justifyContent: "flex-start" }}
    >
      <Typography ellipsis level={"body2"} style={{ width: "100%" }}>
        {subscriber_count === 0 ? (
          "This blog does not have any subscribers."
        ) : (
          <>
            This blog has{" "}
            <span className={css["t-bold"]}>
              {abbreviate_number(subscriber_count)}
            </span>{" "}
            {subscriber_count === 1 ? "subscriber" : "subscribers"}.
          </>
        )}
      </Typography>
      <Spacer className={css["f-grow"]} size={2} />
      <Subscribers />
    </div>
  );
};

const BlogContentNewsletterClient = (
  props: BlogNewsletterProps
): React.ReactElement => {
  const blog = use_blog_context();
  const is_smaller_than_desktop = use_media_query(BREAKPOINTS.down("desktop"));

  return (
    <React.Fragment>
      <main data-root={"true"}>
        <DashboardTitle>Newsletter</DashboardTitle>
        {is_smaller_than_desktop && <SubscribersHeader {...props} />}
        -- Content --
        <Spacer orientation={"vertical"} size={10} />
      </main>
      <BlogContentNewsletterRightSidebar
        subscriber_count={props.subscriber_count}
      />
    </React.Fragment>
  );
};

export default BlogContentNewsletterClient;
