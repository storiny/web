"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import React from "react";
import { Doc } from "yjs";

import { select_user } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";

import { ExcludedProperties } from "../../collaboration/bindings";
import { Provider } from "../../collaboration/provider";
import { useYjsCollaboration } from "../../hooks/use-yjs-collaboration";
import { useYjsFocusTracking } from "../../hooks/use-yjs-focus-tracking";
import { useYjsHistory } from "../../hooks/use-yjs-history";
import { createWebsocketProvider } from "../../utils/create-ws-provider";
import { getUserColor } from "../../utils/get-user-color";
import { useCollaborationContext } from "./context";

interface Props {
  // `awarenessData` parameter allows arbitrary data to be added to the awareness
  awarenessData?: object;
  excludedProperties?: ExcludedProperties;
  id: string;
  isMainEditor?: boolean;
  providerFactory?: (id: string, yjsDocMap: Map<string, Doc>) => Provider;
  role: "editor" | "viewer";
  shouldBootstrap: boolean;
}

const CollaborationPlugin = ({
  id,
  providerFactory = createWebsocketProvider,
  shouldBootstrap,
  excludedProperties,
  isMainEditor,
  role,
  awarenessData
}: Props): React.ReactElement => {
  const user = use_app_selector(select_user)!;
  const localState = React.useMemo(
    () =>
      ({
        name: user.name,
        userId: user.id,
        role,
        color: getUserColor(user.username),
        avatar_id: user.avatar_id,
        avatarHex: user.avatar_hex,
        awarenessData
      }) as const,
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
    provider,
    docMap: yjsDocMap,
    shouldBootstrap:
      // Skip bootstraping the right iframe during tests
      window.parent != null && (window.parent.frames as any).right === window
        ? false
        : shouldBootstrap,
    excludedProperties,
    isMainEditor,
    localState
  });
  useYjsHistory(editor, binding);
  useYjsFocusTracking(editor, provider, localState);

  React.useEffect(() => {
    collabContext.isCollabActive = true;

    return () => {
      // Reset the flag only when unmounting the top level editor collaboration plugin.
      if (editor._parentEditor == null) {
        collabContext.isCollabActive = false;
      }
    };
  }, [collabContext, editor]);

  collabContext.clientID = binding.clientID;

  return cursors;
};

export default CollaborationPlugin;
