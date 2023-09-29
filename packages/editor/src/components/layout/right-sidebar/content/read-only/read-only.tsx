import { useAtomValue } from "jotai";
import React from "react";

import { isAuxiliaryContentVisibleAtom } from "../../../../../atoms";
import EditorToc from "../../../left-sidebar/content/editable/toc";
import RecommendedStories from "./recommended-stories";
import StoryStats from "./stats";
import StoryWriter from "./writer";

const SuspendedEditorRightSidebarReadOnlyContent = (): React.ReactElement => {
  const isAuxiliaryContentVisible = use_atom_value(
    isAuxiliaryContentVisibleAtom
  );
  return (
    <React.Fragment>
      {isAuxiliaryContentVisible ? (
        <RecommendedStories />
      ) : (
        <React.Fragment>
          <StoryWriter />
          <StoryStats />
          <EditorToc readOnly />
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default SuspendedEditorRightSidebarReadOnlyContent;
