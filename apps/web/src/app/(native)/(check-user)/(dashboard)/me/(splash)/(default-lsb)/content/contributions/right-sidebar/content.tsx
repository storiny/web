import { clsx } from "clsx";
import React from "react";

import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import CollaborationRequests from "./collaboration-requests";
import { ContributionsRightSidebarProps } from "./right-sidebar.props";

const ContentContributionsRightSidebarContent = (
  props: ContributionsRightSidebarProps
): React.ReactElement => {
  const { pending_collaboration_request_count } = props;
  return (
    <React.Fragment>
      <Typography color={"minor"} level={"body2"} weight={"medium"}>
        Collaboration requests
      </Typography>
      <div className={css["flex-col"]}>
        <Typography level={"body2"}>
          You have{" "}
          <span className={css["t-bold"]}>
            {abbreviate_number(pending_collaboration_request_count)}
          </span>{" "}
          pending collaboration{" "}
          {pending_collaboration_request_count === 1 ? "request" : "requests"}.
        </Typography>
        <Spacer orientation={"vertical"} size={2} />
        <CollaborationRequests />
      </div>
    </React.Fragment>
  );
};

export default ContentContributionsRightSidebarContent;
