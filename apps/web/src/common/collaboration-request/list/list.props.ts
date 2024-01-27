import { CollaborationRequest } from "@storiny/types";
import { VirtuosoProps } from "react-virtuoso";

import {
  CollaborationRequestProps,
  CollaborationRequestSkeletonProps
} from "~/entities/collaboration-request";

export interface VirtualizedCollaborationRequestListProps
  extends VirtuosoProps<CollaborationRequest, any> {
  /**
   * Props passed down to individual collaboration request entities.
   */
  collaboration_request_props?: Partial<CollaborationRequestProps>;
  /**
   * Array of collaboration requests to render.
   */
  collaboration_requests: CollaborationRequest[];
  /**
   * Flag indicating whether there are more collaboration requests to render.
   */
  has_more: boolean;
  /**
   * A callback function to fetch more collaboration requests.
   */
  load_more: () => void;
  /**
   * Props passed down to individual collaboration request skeleton entities.
   */
  skeleton_props?: Partial<CollaborationRequestSkeletonProps>;
}
