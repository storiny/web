import { InitialEditorStateType } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ExcludedProperties, Provider } from "@lexical/yjs";
import React from "react";
import { Doc } from "yjs";

import {
  CursorsContainerRef,
  useYjsCollaboration,
  useYjsFocusTracking,
  useYjsHistory
} from "../../hooks/use-yjs-collaboration";
import { useCollaborationContext } from "./context";

interface Props {
  // `awarenessData` parameter allows arbitrary data to be added to the awareness.
  awarenessData?: object;
  cursorColor?: string;
  cursorsContainerRef?: CursorsContainerRef;
  excludedProperties?: ExcludedProperties;
  id: string;
  initialEditorState?: InitialEditorStateType;
  providerFactory: (
    // eslint-disable-next-line no-shadow
    id: string,
    yjsDocMap: Map<string, Doc>
  ) => Provider;
  shouldBootstrap: boolean;
  username?: string;
}

const CollaborationPlugin = ({
  id,
  providerFactory,
  shouldBootstrap,
  username,
  cursorColor,
  cursorsContainerRef,
  initialEditorState,
  excludedProperties,
  awarenessData
}: Props): React.ReactElement => {
  const collabContext = useCollaborationContext(username, cursorColor);
  const { yjsDocMap, name, color } = collabContext;
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    collabContext.isCollabActive = true;

    return () => {
      // Reseting flag only when unmount top level editor collab plugin. Nested
      // editors (e.g. image caption) should unmount without affecting it
      if (editor._parentEditor == null) {
        collabContext.isCollabActive = false;
      }
    };
  }, [collabContext, editor]);

  const provider = React.useMemo(
    () => providerFactory(id, yjsDocMap),
    [id, providerFactory, yjsDocMap]
  );

  const [cursors, binding] = useYjsCollaboration(
    editor,
    id,
    provider,
    yjsDocMap,
    name,
    color,
    shouldBootstrap,
    cursorsContainerRef,
    initialEditorState,
    excludedProperties,
    awarenessData
  );

  collabContext.clientID = binding.clientID;

  useYjsHistory(editor, binding);
  useYjsFocusTracking(editor, provider, name, color, awarenessData);

  return cursors;
};

export default CollaborationPlugin;
