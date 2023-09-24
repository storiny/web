import React from "react";

import CustomState from "~/entities/CustomState";

const EditorAuxiliaryContentSuggestionListEmptyState =
  (): React.ReactElement => (
    <CustomState
      autoSize
      description={"We were unable to find enough similar stories to display."}
      title={"No recommendations"}
    />
  );

export default EditorAuxiliaryContentSuggestionListEmptyState;
