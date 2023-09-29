import { Story } from "@storiny/types";
import React from "react";

export interface StoryMetadataModalProps {
  children?: React.ReactNode;
  set_story: (next_story: Story) => void;
  story: Story;
}
