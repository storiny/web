import React from "react";

import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import { NewsletterRightSidebarProps } from "./right-sidebar.props";
import Subscribers from "./subscribers";

const BlogContentNewsletterRightSidebarContent = (
  props: NewsletterRightSidebarProps
): React.ReactElement => {
  const { subscriber_count } = props;
  return (
    <React.Fragment>
      <Typography color={"minor"} level={"body2"} weight={"medium"}>
        Subscribers
      </Typography>
      <div className={css["flex-col"]}>
        <Typography level={"body2"}>
          This blog has{" "}
          <span className={css["t-bold"]}>
            {abbreviate_number(subscriber_count)}
          </span>{" "}
          {subscriber_count === 1 ? "subscriber" : "subscribers"}.
        </Typography>
        <Spacer orientation={"vertical"} size={2} />
        <Subscribers />
      </div>
    </React.Fragment>
  );
};

export default BlogContentNewsletterRightSidebarContent;
