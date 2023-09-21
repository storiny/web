import dynamic from "next/dynamic";
import React from "react";

import EditorBody from "../body";
import EditorLayout from "../layout";
import { EditorProps } from "./editor.props";

const EditorShortcuts = dynamic(() => import("../../shortcuts"));

const Editor = (props: EditorProps): React.ReactElement => (
  <EditorLayout
    readOnly={props.readOnly}
    status={props.status}
    story={props.story}
  >
    <EditorBody
      {...props}
      readOnly={props.readOnly || props.status === "deleted"}
    />
    {!props.readOnly && props.status !== "deleted" ? <EditorShortcuts /> : null}
  </EditorLayout>
);

export default Editor;
