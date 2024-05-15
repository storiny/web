import React from "react";

import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import EditorRequests from "./editor-requests";
import { EditorsRightSidebarProps } from "./right-sidebar.props";

const BlogContentEditorsRightSidebarContent = (
  props: EditorsRightSidebarProps
): React.ReactElement => {
  const { pending_editor_request_count } = props;
  return (
    <React.Fragment>
      <Typography color={"minor"} level={"body2"} weight={"medium"}>
        Editor requests
      </Typography>
      <div className={css["flex-col"]}>
        <Typography level={"body2"}>
          You have sent{" "}
          <span className={css["t-bold"]}>
            {abbreviate_number(pending_editor_request_count)}
          </span>{" "}
          editor {pending_editor_request_count === 1 ? "request" : "requests"}{" "}
          that are still pending.
        </Typography>
        <Spacer orientation={"vertical"} size={2} />
        <EditorRequests />
      </div>
    </React.Fragment>
  );
};

export default BlogContentEditorsRightSidebarContent;
