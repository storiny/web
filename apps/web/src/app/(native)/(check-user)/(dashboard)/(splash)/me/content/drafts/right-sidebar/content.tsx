import React from "react";

import Typography from "~/components/typography";

import Draft from "./draft";
import { DraftsRightSidebarProps } from "./right-sidebar.props";

const ContentDraftsRightSidebarContent = (
  props: DraftsRightSidebarProps
): React.ReactElement => {
  const { latest_draft, tab } = props;
  return (
    <React.Fragment>
      <Typography color={"minor"} level={"body2"} weight={"medium"}>
        {tab === "pending"
          ? "Pick up where you left off"
          : "About deleted drafts"}
      </Typography>
      {tab === "pending" ? (
        <Draft latest_draft={latest_draft!} />
      ) : (
        <Typography color={"minor"} level={"body2"}>
          Drafts that you delete will remain here for up to 30 days, allowing
          you to restore them before they are permanently deleted.
        </Typography>
      )}
    </React.Fragment>
  );
};

export default ContentDraftsRightSidebarContent;
