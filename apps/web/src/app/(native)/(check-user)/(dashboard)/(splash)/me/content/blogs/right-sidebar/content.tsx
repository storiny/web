import React from "react";

import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import BlogRequests from "./blog-requests";
import MembershipCard from "./membership-card";
import { BlogsRightSidebarProps } from "./right-sidebar.props";

const ContentBlogsRightSidebarContent = (
  props: Pick<BlogsRightSidebarProps, "pending_blog_request_count">
): React.ReactElement => {
  const { pending_blog_request_count } = props;
  return (
    <React.Fragment>
      <Typography color={"minor"} level={"body2"} weight={"medium"}>
        Blog requests
      </Typography>
      <div className={css["flex-col"]}>
        <Typography level={"body2"}>
          {pending_blog_request_count === 0 ? (
            "You have no pending blog requests."
          ) : (
            <>
              You have{" "}
              <span className={css["t-bold"]}>
                {abbreviate_number(pending_blog_request_count)}
              </span>{" "}
              pending blog{" "}
              {pending_blog_request_count === 1 ? "request" : "requests"}.
            </>
          )}
        </Typography>
        {pending_blog_request_count !== 0 && (
          <>
            <Spacer orientation={"vertical"} size={2} />
            <BlogRequests />
          </>
        )}
        <Spacer orientation={"vertical"} size={3.5} />
        <Divider />
        <Spacer orientation={"vertical"} size={3.5} />
        <MembershipCard />
      </div>
    </React.Fragment>
  );
};

export default ContentBlogsRightSidebarContent;
