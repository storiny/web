import { InitialEditorStateType } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React from "react";
import { Doc } from "yjs";

import { selectUser } from "~/redux/features";
import { useAppSelector } from "~/redux/hooks";

import { ExcludedProperties } from "../../collab/bindings";
import { Provider } from "../../collab/provider";
import { useYjsCollaboration } from "../../hooks/use-yjs-collaboration";
import { useYjsFocusTracking } from "../../hooks/use-yjs-focus-tracking";
import { useYjsHistory } from "../../hooks/use-yjs-history";
import { getUserColor } from "../../utils/get-user-color";
import { useCollaborationContext } from "./context";

interface Props {
  // `awarenessData` parameter allows arbitrary data to be added to the awareness
  awarenessData?: object;
  excludedProperties?: ExcludedProperties;
  id: string;
  initialEditorState?: InitialEditorStateType;
  isMainEditor?: boolean;
  providerFactory: (id: string, yjsDocMap: Map<string, Doc>) => Provider;
  role: "editor" | "viewer";
  shouldBootstrap: boolean;
}

const CollaborationPlugin = ({
  id,
  providerFactory,
  shouldBootstrap,
  initialEditorState,
  excludedProperties,
  isMainEditor,
  role,
  awarenessData
}: Props): React.ReactElement => {
  const user = useAppSelector(selectUser)!;
  const localState = React.useMemo(
    () =>
      ({
        name: user.name,
        userId: user.id,
        role,
        color: getUserColor(user.username),
        avatarId: user.avatar_id,
        avatarHex: user.avatar_hex,
        awarenessData
      } as const),
    [
      awarenessData,
      role,
      user.avatar_hex,
      user.avatar_id,
      user.id,
      user.name,
      user.username
    ]
  );
  const [editor] = useLexicalComposerContext();
  const collabContext = useCollaborationContext(localState);
  const { yjsDocMap } = collabContext;
  const provider = React.useMemo(
    () => providerFactory(id, yjsDocMap),
    [id, providerFactory, yjsDocMap]
  );
  const [cursors, binding] = useYjsCollaboration({
    id,
    editor,
    provider,
    docMap: yjsDocMap,
    shouldBootstrap,
    initialEditorState,
    excludedProperties,
    isMainEditor,
    localState
  });
  useYjsHistory(editor, binding);
  useYjsFocusTracking(editor, provider, localState);

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

  collabContext.clientID = binding.clientID;

  return cursors;
};

export default CollaborationPlugin;
