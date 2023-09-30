import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import CustomState from "~/entities/custom-state";

import { query_atom } from "../../atoms";

interface GalleryEmptyStateProps {
  tab: "pexels" | "library";
}

const GalleryEmptyState = ({
  tab
}: GalleryEmptyStateProps): React.ReactElement => {
  const query = use_atom_value(query_atom);
  return (
    <CustomState
      description={
        query
          ? "Your search criteria did not match anything, make sure you've spelled it correctly or try again by being more specific."
          : tab === "library"
          ? "Media you upload will appear here."
          : "Looks like we'll just have to use our imaginations for now."
      }
      size={"sm"}
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
