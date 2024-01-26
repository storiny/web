import { DocUserRole, Story } from "@storiny/types";
import { useHydrateAtoms as use_hydrate_atoms } from "jotai/react/utils";
import React from "react";

import { sync_with_story } from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";

import { story_metadata_atom } from "../../atoms";

const HydrateMetadata = ({
  story,
  children,
  is_writer,
  role
}: {
  children: React.ReactElement;
  is_writer: boolean;
  role: DocUserRole;
  story: Story;
}): React.ReactElement => {
  const dispatch = use_app_dispatch();
  use_hydrate_atoms([[story_metadata_atom, { ...story, is_writer, role }]]);

  React.useEffect(() => {
    dispatch(sync_with_story(story));
  }, [dispatch, story]);

  return children;
};

export default HydrateMetadata;
