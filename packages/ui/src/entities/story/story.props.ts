import { Story } from "@storiny/types";
import React from "react";

export interface StoryProps extends React.ComponentPropsWithoutRef<"article"> {
  /**
   * A custom action item for the action menu.
   */
  custom_action?: (story: Story) => React.ReactNode;
  /**
   * Enables SSR.
   */
  enable_ssr?: boolean;
  /**
   * If `true`, the story link points to the editable document.
   */
  is_blog?: boolean;
  /**
   * If `true`, renders with contributable properties
   */
  is_contributable?: boolean;
  /**
   * If `true`, renders with deleted story properties
   */
  is_deleted?: boolean;
  /**
   * If `true`, renders with draft properties
   */
  is_draft?: boolean;
  /**
   * If `true`, renders with extended properties
   */
  is_extended?: boolean;
  /**
   * If `true`, renders the large variant
   */
  is_large?: boolean;
  /**
   * If `true`, renders an unlike button.
   * @default false
   */
  show_unlike_button?: boolean;
  /**
   * The story object.
   */
  story: Story;
  /**
   * Whether the story is rendered inside a virtualized list.
   */
  virtual?: boolean;
}
