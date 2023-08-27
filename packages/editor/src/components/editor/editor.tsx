import { dynamicLoader } from "@storiny/web/src/common/dynamic";
import dynamic from "next/dynamic";
import React from "react";

import Spacer from "~/components/Spacer";

import EditorLayout from "../layout";
import EditorLoader from "../loader";

const EditorShortcuts = dynamic(() => import("../../shortcuts"));
const EditorBody = dynamic(() => import("../body"), {
  loading: dynamicLoader(() => <EditorLoader />)
});

const Editor = (): React.ReactElement => (
  <EditorLayout>
    <EditorBody />
    <Spacer className={"f-grow"} orientation={"vertical"} size={10} />
    <EditorShortcuts />
  </EditorLayout>
);

export default Editor;
