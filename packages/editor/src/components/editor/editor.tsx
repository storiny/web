import dynamic from "next/dynamic";
import React from "react";

import EditorBody from "../body";
import EditorLayout from "../layout";
import { EditorProps } from "./editor.props";

const EditorShortcuts = dynamic(() => import("../../shortcuts"));
const EditorAuxiliaryContent = dynamic(() => import("../auxiliary-content"));

const Editor = (props: EditorProps): React.ReactElement => (
  <EditorLayout
    is_writer={props.is_writer}
    read_only={props.read_only}
    role={props.role}
    status={props.status}
    story={props.story}
  >
    <EditorBody
      {...props}
      read_only={props.read_only || props.status === "deleted"}
    />
    {!props.read_only && props.status !== "deleted" ? (
      <EditorShortcuts />
    ) : null}
    {props.read_only && <EditorAuxiliaryContent />}
  </EditorLayout>
);

export default Editor;
