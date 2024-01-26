"use client";

import React from "react";

import {
  CollaborationRequestProps,
  CollaborationRequestSkeletonProps
} from "~/entities/collaboration-request";

// Context for individual collaboration request entities.
export const VirtualizedCollaborationRequestListContext = React.createContext<{
  collaboration_request_props: Partial<CollaborationRequestProps>;
  skeleton_props: Partial<CollaborationRequestSkeletonProps>;
}>({ collaboration_request_props: {}, skeleton_props: {} });
