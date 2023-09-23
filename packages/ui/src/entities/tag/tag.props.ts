import { Tag } from "@storiny/types";
import React from "react";

export interface TagProps extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * The tag object.
   */
  tag: Tag;
  /**
   * Whether the tag is rendered inside a virtualized list.
   */
  virtual?: boolean;
}
