import { CollaborationRequest } from "@storiny/types";
import React from "react";

export interface CollaborationRequestProps
  extends React.ComponentPropsWithoutRef<"div"> {
  /**
   * The collaboration request object
   */
  collaboration_request: CollaborationRequest;
  /**
   * The type of the collaboration request
   * @default 'received'
   */
  type?: "received" | "sent";
}
