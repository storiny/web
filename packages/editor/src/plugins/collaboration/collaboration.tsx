import { InitialEditorStateType } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useSetAtom } from "jotai";
import React from "react";
import { Doc } from "yjs";

import { selectUser } from "~/redux/features";
import { useAppSelector } from "~/redux/hooks";

import { awarenessAtom } from "../../atoms";
import { ExcludedProperties } from "../../collab/bindings";
import { Provider } from "../../collab/provider";
import {
  CursorsContainerRef,
  useYjsCollaboration
} from "../../hooks/use-yjs-collaboration";
import { useYjsFocusTracking } from "../../hooks/use-yjs-focus-tracking";
import { useYjsHistory } from "../../hooks/use-yjs-history";
import { useCollaborationContext } from "./context";

interface Props {
  // `awarenessData` parameter allows arbitrary data to be added to the awareness
  awarenessData?: object;
  cursorsContainerRef?: CursorsContainerRef;
  excludedProperties?: ExcludedProperties;
  id: string;
  initialEditorState?: InitialEditorStateType;
  isMainEditor?: boolean;
  providerFactory: (
    // eslint-disable-next-line no-shadow
    id: string,
    yjsDocMap: Map<string, Doc>
  ) => Provider;
  shouldBootstrap: boolean;
}

// TODO: Gen random
const COLOR = "#000";

const CollaborationPlugin = ({
  id,
  providerFactory,
  shouldBootstrap,
  initialEditorState,
  excludedProperties,
  isMainEditor,
  cursorsContainerRef,
  awarenessData
}: Props): React.ReactElement => {
  const user = useAppSelector(selectUser)!;
  const collabContext = useCollaborationContext({
    name: user.name,
    color: COLOR,
    avatarId: user.avatar_id,
    avatarHex: user.avatar_hex
  });
  const { yjsDocMap } = collabContext;
  const [editor] = useLexicalComposerContext();

  React.useEffect(() => {
    collabContext.isCollabActive = true;

    return () => {
      // Reset the flag only when unmounting the top level editor collab plugin. Nested
      // editors (e.g., image caption) should unmount without affecting it
      if (editor._parentEditor == null) {
        collabContext.isCollabActive = false;
      }
    };
  }, [collabContext, editor]);

  const provider = React.useMemo(
    () => providerFactory(id, yjsDocMap),
    [id, providerFactory, yjsDocMap]
  );
  const [cursors, binding] = useYjsCollaboration({
    id,
    editor,
    provider,
    name: user.name,
    color: COLOR,
    avatarId: user.avatar_id,
    avatarHex: user.avatar_hex,
    docMap: yjsDocMap,
    shouldBootstrap,
    initialEditorState,
    excludedProperties,
    isMainEditor,
    cursorsContainerRef,
    awarenessData
  });

  collabContext.clientID = binding.clientID;

  useYjsHistory(editor, binding);
  useYjsFocusTracking({
    awarenessData,
    name: user.name,
    color: COLOR,
    avatarId: user.avatar_id,
    avatarHex: user.avatar_hex,
    editor,
    provider
  });

  return cursors;
};

export default CollaborationPlugin;
