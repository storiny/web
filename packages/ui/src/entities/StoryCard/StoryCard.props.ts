import { Story } from "@storiny/types";
import React from "react";

export interface StoryCardProps
  extends React.ComponentPropsWithoutRef<"article"> {
  /**
   * The story object
   */
  story: Story;
}
