import React from "react";

import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import { WritersRightSidebarProps } from "./right-sidebar.props";
import WriterRequests from "./writer-requests";

const BlogContentWritersRightSidebarContent = (
  props: WritersRightSidebarProps
): React.ReactElement => {
  const { pending_writer_request_count } = props;
  return (
    <React.Fragment>
      <Typography color={"minor"} level={"body2"} weight={"medium"}>
        Writer requests
      </Typography>
      <div className={css["flex-col"]}>
        <Typography level={"body2"}>
          You have sent{" "}
          <span className={css["t-bold"]}>
            {abbreviate_number(pending_writer_request_count)}
          </span>{" "}
          writer {pending_writer_request_count === 1 ? "request" : "requests"}{" "}
          that are still pending.
        </Typography>
        <Spacer orientation={"vertical"} size={2} />
        <WriterRequests />
      </div>
    </React.Fragment>
  );
};

export default BlogContentWritersRightSidebarContent;
