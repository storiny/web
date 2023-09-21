import React from "react";

import { StoryStatus } from "../../../../../editor";

export interface EditorStoryCardProps
  extends React.ComponentPropsWithoutRef<"article"> {
  status: StoryStatus;
}
