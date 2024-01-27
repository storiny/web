"use client";

import { CollaborationRequest as TCollaborationRequest } from "@storiny/types";
import React from "react";
import { ItemProps } from "react-virtuoso";

import Divider from "~/components/divider";
import CollaborationRequest from "~/entities/collaboration-request";
import css from "~/theme/main.module.scss";

import { VirtualizedCollaborationRequestListContext } from "../list/list-context";

const VirtualizedCollaborationRequestItem = React.memo(
  ({ item, ...rest }: ItemProps<TCollaborationRequest>) => {
    // Props from context
    const { collaboration_request_props } = React.useContext(
      VirtualizedCollaborationRequestListContext
    );
    return (
      <div {...rest} className={css["flex-col"]}>
        <CollaborationRequest
          {...collaboration_request_props}
          collaboration_request={item}
        />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedCollaborationRequestItem.displayName =
  "VirtualizedCollaborationRequestItem";

export default VirtualizedCollaborationRequestItem;
