import React from "react";

import Typography from "~/components/typography";

const ContentStoriesRightSidebarContent = (): React.ReactElement => (
  <React.Fragment>
    <Typography color={"minor"} level={"body2"} weight={"medium"}>
      About deleted stories
    </Typography>
    <Typography color={"minor"} level={"body2"}>
      Stories that you delete will remain here for up to 30 days, allowing you
      to restore them before they are permanently deleted.
      <br />
      <br />
      When you restore a story, it will be moved to your pending drafts for you
      to make changes and publish it again.
    </Typography>
  </React.Fragment>
);

export default ContentStoriesRightSidebarContent;
