import { Story } from "@storiny/types";
import React from "react";

export interface StoryMetadataModalProps {
  children?: React.ReactNode;
  setStory: (nextStory: Story) => void;
  story: Story;
}
