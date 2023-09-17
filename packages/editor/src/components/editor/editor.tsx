import { dynamicLoader } from "@storiny/web/src/common/dynamic";
import dynamic from "next/dynamic";
import React from "react";

import EditorLayout from "../layout";
import EditorLoader from "../loader";

const EditorShortcuts = dynamic(() => import("../../shortcuts"));
const EditorBody = dynamic(() => import("../body"), {
  loading: dynamicLoader(() => <EditorLoader />)
});

const Editor = ({ docId }: { docId: string }): React.ReactElement => (
  <EditorLayout>
    <EditorBody docId={docId} />
    <EditorShortcuts />
  </EditorLayout>
);

export default Editor;
