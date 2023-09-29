"use client";

import { useLexicalComposerContext as use_lexical_composer_context } from "@lexical/react/LexicalComposerContext";
import React from "react";
import { Doc } from "yjs";

import { select_user } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";

import { ExcludedProperties } from "../../collaboration/bindings";
import { Provider } from "../../collaboration/provider";
import { use_yjs_collaboration } from "../../hooks/use-yjs-collaboration";
import { use_yjs_focus_tracking } from "../../hooks/use-yjs-focus-tracking";
import { use_yjs_history } from "../../hooks/use-yjs-history";
import { create_ws_provider } from "../../utils/create-ws-provider";
import { get_user_color } from "../../utils/get-user-color";
import { use_collaboration_context } from "./context";

interface Props {
  // `awareness_data` parameter allows arbitrary data to be added to the awareness
  awareness_data?: object;
  excluded_properties?: ExcludedProperties;
  id: string;
  provider_factory?: (id: string, yjs_doc_map: Map<string, Doc>) => Provider;
  role: "editor" | "viewer";
  should_bootstrap: boolean;
}

const CollaborationPlugin = ({
  id,
  provider_factory = create_ws_provider,
  should_bootstrap,
  excluded_properties,
  role,
  awareness_data
}: Props): React.ReactElement => {
  const user = use_app_selector(select_user)!;
  const local_state = React.useMemo(
    () =>
      ({
        name: user.name,
        user_id: user.id,
        role,
        color: get_user_color(user.username),
        avatar_id: user.avatar_id,
        avatar_hex: user.avatar_hex,
        awareness_data
      }) as const,
    [
      awareness_data,
      role,
      user.avatar_hex,
      user.avatar_id,
      user.id,
      user.name,
      user.username
    ]
  );
  const [editor] = use_lexical_composer_context();
  const collab_context = use_collaboration_context(local_state);
  const { yjs_doc_map } = collab_context;
  const provider = React.useMemo(
    () => provider_factory(id, yjs_doc_map),
    [id, provider_factory, yjs_doc_map]
  );
  const [cursors, binding] = use_yjs_collaboration({
    provider,
    doc_map: yjs_doc_map,
    should_bootstrap:
      // Skip bootstraping the right iframe during tests
      window.parent != null && (window.parent.frames as any).right === window
        ? false
        : should_bootstrap,
    excluded_properties,
    local_state
  });
  use_yjs_history(editor, binding);
  use_yjs_focus_tracking(editor, provider, local_state);

  React.useEffect(() => {
    collab_context.is_collab_active = true;

    return () => {
      // Reset the flag only when unmounting the top level editor collaboration plugin.
      if (editor._parentEditor == null) {
        collab_context.is_collab_active = false;
      }
    };
  }, [collab_context, editor]);

  collab_context.clientID = binding.clientID;

  return cursors;
};

export default CollaborationPlugin;
