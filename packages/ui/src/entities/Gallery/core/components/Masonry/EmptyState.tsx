import { useAtomValue } from "jotai";
import React from "react";

import CustomState from "~/entities/CustomState";

import { queryAtom } from "../../atoms";

interface GalleryEmptyStateProps {
  tab: "pexels" | "library";
}

const GalleryEmptyState = ({
  tab
}: GalleryEmptyStateProps): React.ReactElement => {
  const query = useAtomValue(queryAtom);
  return (
    <CustomState
      autoSize
      description={
        query
          ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
          : tab === "library"
          ? "Media you upload will appear here."
          : "Looks like we'll just have to use our imaginations for now."
      }
      title={
        query
          ? `Could not find any media for "${query}"`
          : tab === "library"
          ? "No uploads"
          : "No content is available here yet"
      }
    />
  );
};

export default GalleryEmptyState;
