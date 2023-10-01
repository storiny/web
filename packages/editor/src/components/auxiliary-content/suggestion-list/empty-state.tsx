import React from "react";

import CustomState from "~/entities/custom-state";

const EditorAuxiliaryContentSuggestionListEmptyState =
  (): React.ReactElement => (
    <CustomState
      auto_size
      description={"We were unable to find enough similar stories to display."}
      title={"No recommendations"}
    />
  );

export default EditorAuxiliaryContentSuggestionListEmptyState;
