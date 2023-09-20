import dynamic from "next/dynamic";
import React from "react";

import EditorBody from "../body";
import EditorLayout from "../layout";
import { EditorProps } from "./editor.props";

const EditorShortcuts = dynamic(() => import("../../shortcuts"));

const Editor = (props: EditorProps): React.ReactElement => (
  <EditorLayout readOnly={props.readOnly} story={props.story}>
    <EditorBody {...props} />
    {!props.readOnly && <EditorShortcuts />}
  </EditorLayout>
);

export default Editor;
