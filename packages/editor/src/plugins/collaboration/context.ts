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
    user_id: ""
  });

/**
 * Hook for using collaboration context
 */
export const use_collaboration_context = ({
  name,
  color_fg,
  color_bg,
  role,
  user_id
}: Partial<
  Pick<
    CollaborationContextType,
    "user_id" | "name" | "color_bg" | "color_fg" | "role"
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

  if (color_bg !== undefined) {
    context.color_bg = color_bg;
  }

  if (color_fg !== undefined) {
    context.color_fg = color_fg;
  }

  return context;
};
