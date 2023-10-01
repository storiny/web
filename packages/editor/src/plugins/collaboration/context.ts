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
    avatar_hex: null,
    avatar_id: null,
    color: "",
    name: "",
    role: "viewer",
    user_id: ""
  });

/**
 * Hook for using collaboration context
 */
export const use_collaboration_context = ({
  name,
  color,
  avatar_id,
  avatar_hex,
  role,
  user_id
}: Partial<
  Pick<
    CollaborationContextType,
    "user_id" | "name" | "color" | "avatar_id" | "avatar_hex" | "role"
  >
>): CollaborationContextType => {
  const context = React.useContext(CollaborationContext);

  if (user_id !== undefined) {
    context.user_id = user_id;
  }

  if (role !== undefined) {
    context.role = role;
  }

  if (name !== undefined) {
    context.name = name;
  }

  if (color !== undefined) {
    context.color = color;
  }

  if (avatar_id !== undefined) {
    context.avatar_id = avatar_id;
  }

  if (avatar_hex !== undefined) {
    context.avatar_hex = avatar_hex;
  }

  return context;
};
