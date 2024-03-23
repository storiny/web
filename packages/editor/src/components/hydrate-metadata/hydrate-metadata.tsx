import { DocUserRole, Story } from "@storiny/types";
import { useHydrateAtoms as use_hydrate_atoms } from "jotai/react/utils";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { sync_with_story } from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";

import { sidebars_collapsed_atom, story_metadata_atom } from "../../atoms";

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
  const blog = use_blog_context();
  use_hydrate_atoms([
    [
      story_metadata_atom,
      {
        ...story,
        is_writer,
        role
      }
    ],
    [sidebars_collapsed_atom, Boolean(blog?.is_story_minimal_layout)]
  ]);

  React.useEffect(() => {
    dispatch(sync_with_story(story));
  }, [dispatch, story]);

  return children;
};

export default HydrateMetadata;
