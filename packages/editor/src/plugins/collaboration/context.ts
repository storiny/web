import React from "react";
import { Doc } from "yjs";

import { UserState } from "../../collab/provider";

interface CollaborationContextType
  extends Omit<
    UserState,
    "awarenessData" | "focusPos" | "anchorPos" | "focusing"
  > {
  clientID: number;
  isCollabActive: boolean;
  yjsDocMap: Map<string, Doc>;
}

export const CollaborationContext =
  React.createContext<CollaborationContextType>({
    clientID: 0,
    isCollabActive: false,
    yjsDocMap: new Map(),
    avatarHex: null,
    avatarId: null,
    color: "",
    name: "",
    role: "viewer",
    userId: ""
  });

/**
 * Hook for using collaboration context
 */
export const useCollaborationContext = ({
  name,
  color,
  avatarId,
  avatarHex,
  role,
  userId
}: Partial<
  Pick<
    CollaborationContextType,
    "userId" | "name" | "color" | "avatarId" | "avatarHex" | "role"
  >
>): CollaborationContextType => {
  const context = React.useContext(CollaborationContext);

  if (userId !== undefined) {
    context.userId = userId;
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

  if (avatarId !== undefined) {
    context.avatarId = avatarId;
  }

  if (avatarHex !== undefined) {
    context.avatarHex = avatarHex;
  }

  return context;
};
