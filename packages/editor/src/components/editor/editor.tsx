import { dynamicLoader } from "@storiny/web/src/common/dynamic";
import dynamic from "next/dynamic";
import React from "react";

import EditorLayout from "../layout";
import EditorLoader from "../loader";
import { EditorProps } from "./editor.props";

const EditorShortcuts = dynamic(() => import("../../shortcuts"));
const EditorBody = dynamic(() => import("../body"), {
  loading: dynamicLoader(() => <EditorLoader />)
});

const Editor = (props: EditorProps): React.ReactElement => (
  <EditorLayout>
    <EditorBody {...props} />
    <EditorShortcuts />
  </EditorLayout>
);

export default Editor;
