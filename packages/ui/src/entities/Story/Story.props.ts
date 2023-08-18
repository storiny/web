import { Story } from "@storiny/types";
import React from "react";

export interface StoryProps extends React.ComponentPropsWithoutRef<"article"> {
  /**
   * Enables SSR.
   */
  enableSsr?: boolean;
  /**
   * If `true`, renders with deleted story properties
   */
  isDeleted?: boolean;
  /**
   * If `true`, renders with draft properties
   */
  isDraft?: boolean;
  /**
   * If `true`, renders with extended properties
   */
  isExtended?: boolean;
  /**
   * If `true`, renders an unlike button.
   * @default false
   */
  showUnlikeButton?: boolean;
  /**
   * The story object.
   */
  story: Story;
}
