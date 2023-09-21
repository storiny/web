import React from "react";

import StoryStats from "./stats";
import StoryWriter from "./writer";

const SuspendedEditorRightSidebarReadOnlyContent = (): React.ReactElement => (
  <React.Fragment>
    <StoryWriter />
    <StoryStats />
  </React.Fragment>
);

export default SuspendedEditorRightSidebarReadOnlyContent;
