import React from "react";
import { Doc } from "yjs";

import { UserState } from "../../collaboration/provider";

interface CollaborationContextType
  extends Omit<
    UserState,
    "awareness_data" | "focus_pos" | "anchor_pos" | "focusing"
  > {
  client_id: number;
  is_collab_active: boolean;
  yjs_doc_map: Map<string, Doc>;
}

export const CollaborationContext =
  React.createContext<CollaborationContextType>({
    client_id: 0,
    is_collab_active: false,
    yjs_doc_map: new Map(),
    color_bg: "",
    color_fg: "",
    name: "",
    role: "viewer",
    user_id: "",
    avatar_id: null,
    avatar_hex: null
  });

/**
 * Sets context key-value if they are defined.
 * @param context The context instance.
 * @param key The key.
 * @param value The value at the key.
 */
const set_if_defined = <
  T extends CollaborationContextType,
  K extends keyof T,
  V extends T[K]
>(
  context: T,
  key: K,
  value: V | undefined
): void => {
  if (value !== undefined) {
    context[key] = value;
  }
};

/**
 * Hook for using collaboration context
 */
export const use_collaboration_context = ({
  name,
  color_fg,
  color_bg,
  role,
  user_id,
  avatar_id,
  avatar_hex
}: Partial<
  Pick<
    CollaborationContextType,
    | "user_id"
    | "name"
    | "color_bg"
    | "color_fg"
    | "role"
    | "avatar_id"
    | "avatar_hex"
  >
>): CollaborationContextType => {
  const context = React.useContext(CollaborationContext);

  set_if_defined(context, "user_id", user_id);
  set_if_defined(context, "role", role);
  set_if_defined(context, "name", name);
  set_if_defined(context, "color_bg", color_bg);
  set_if_defined(context, "color_fg", color_fg);
  set_if_defined(context, "avatar_id", avatar_id);
  set_if_defined(context, "avatar_hex", avatar_hex);

  return context;
};
