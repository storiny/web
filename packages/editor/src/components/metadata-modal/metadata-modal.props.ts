import React from "react";

import { StoryMetadata } from "../../atoms";

export interface StoryMetadataModalProps {
  children?: React.ReactNode;
  set_story: (next_story: StoryMetadata) => void;
  story: StoryMetadata;
}
