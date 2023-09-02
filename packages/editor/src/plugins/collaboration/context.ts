import React from "react";
import { Doc } from "yjs";

interface CollaborationContextType {
  avatarHex: string | null;
  avatarId: string | null;
  clientID: number;
  color: string;
  isCollabActive: boolean;
  name: string;
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
    name: ""
  });

/**
 * Hook for using collaboration context
 */
export const useCollaborationContext = ({
  name,
  color,
  avatarId,
  avatarHex
}: {
  avatarHex?: string | null;
  avatarId?: string | null;
  color?: string;
  name?: string;
}): CollaborationContextType => {
  const context = React.useContext(CollaborationContext);

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
