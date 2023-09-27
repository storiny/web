import { Story } from "@storiny/types";
import { useHydrateAtoms } from "jotai/react/utils";
import React from "react";

import { sync_with_story } from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";

import { storyMetadataAtom } from "../../atoms";

const HydrateMetadata = ({
  story,
  children
}: {
  children: React.ReactElement;
  story: Story;
}): React.ReactElement => {
  const dispatch = use_app_dispatch();
  useHydrateAtoms([[storyMetadataAtom, story]]);

  React.useEffect(() => {
    dispatch(sync_with_story(story));
  }, [dispatch, story]);

  return children;
};

export default HydrateMetadata;
