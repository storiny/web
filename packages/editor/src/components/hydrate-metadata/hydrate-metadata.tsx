import { Story } from "@storiny/types";
import { useHydrateAtoms } from "jotai/react/utils";
import React from "react";

import { syncWithStory } from "~/redux/features";
import { useAppDispatch } from "~/redux/hooks";

import { storyMetadataAtom } from "../../atoms";

const HydrateMetadata = ({
  story,
  children
}: {
  children: React.ReactElement;
  story: Story;
}): React.ReactElement => {
  const dispatch = useAppDispatch();
  useHydrateAtoms([[storyMetadataAtom, story]]);

  React.useEffect(() => {
    dispatch(syncWithStory(story));
  }, [dispatch, story]);

  return children;
};

export default HydrateMetadata;
