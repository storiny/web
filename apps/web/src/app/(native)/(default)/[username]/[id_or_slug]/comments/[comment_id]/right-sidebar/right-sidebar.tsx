import React from "react";

import Grow from "~/components/grow";
import Typography from "~/components/typography";
import RightSidebar from "~/layout/right-sidebar";

import StoryCommentsRightSidebarContent from "./content";

interface Props {
  story_id: string;
}

const StoryCommentsRightSidebar = ({ story_id }: Props): React.ReactElement => (
  <RightSidebar>
    <Typography color={"minor"} level={"body2"} weight={"bold"}>
      Commented on
    </Typography>
    <StoryCommentsRightSidebarContent story_id={story_id} />
    {/* Push the footer to the bottom of the viewport */}
    <Grow />
  </RightSidebar>
);

export default StoryCommentsRightSidebar;
