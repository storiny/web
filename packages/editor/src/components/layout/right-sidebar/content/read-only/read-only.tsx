import { useAtomValue as use_atom_value } from "jotai";
import React from "react";

import { is_auxiliary_content_visible_atom } from "../../../../../atoms";
import EditorToc from "../../../left-sidebar/content/editable/toc";
import RecommendedStories from "./recommended-stories";
import StoryStats from "./stats";
import StoryWriter from "./writer";

const SuspendedEditorRightSidebarReadOnlyContent = (): React.ReactElement => {
  const is_auxiliary_content_visible = use_atom_value(
    is_auxiliary_content_visible_atom
  );
  return (
    <React.Fragment>
      {is_auxiliary_content_visible ? (
        <RecommendedStories />
      ) : (
        <React.Fragment>
          <StoryWriter />
          <StoryStats />
          <EditorToc read_only />
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default SuspendedEditorRightSidebarReadOnlyContent;
