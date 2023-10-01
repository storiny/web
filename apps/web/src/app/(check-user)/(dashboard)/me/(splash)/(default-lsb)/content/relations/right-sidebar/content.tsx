import { clsx } from "clsx";
import React from "react";

import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import { abbreviate_number } from "~/utils/abbreviate-number";

import FriendRequests from "./friend-requests";
import { RelationsRightSidebarProps } from "./right-sidebar.props";

const ContentRelationsRightSidebarContent = (
  props: Omit<RelationsRightSidebarProps, "tab">
): React.ReactElement => {
  const { pending_friend_request_count } = props;
  return (
    <React.Fragment>
      <Typography className={clsx("t-medium", "t-minor")} level={"body2"}>
        Friend requests
      </Typography>
      <div className={"flex-col"}>
        <Typography level={"body2"}>
          You have{" "}
          <span className={"t-bold"}>
            {abbreviate_number(pending_friend_request_count)}
          </span>{" "}
          pending friend{" "}
          {pending_friend_request_count === 1 ? "request" : "requests"}.
        </Typography>
        <Spacer orientation={"vertical"} size={2} />
        <FriendRequests />
      </div>
    </React.Fragment>
  );
};

export default ContentRelationsRightSidebarContent;
