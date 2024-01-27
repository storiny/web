"use client";

import { clsx } from "clsx";
import React from "react";
import { Virtuoso } from "react-virtuoso";

import css from "~/theme/main.module.scss";

import VirtualFooter from "../../virtual/footer";
import {
  VirtualizedCollaborationRequestItem,
  VirtualizedCollaborationRequestScrollSeekPlaceholder
} from "..";
import { VirtualizedCollaborationRequestListProps } from "./list.props";
import { VirtualizedCollaborationRequestListContext } from "./list-context";

const VirtualizedCollaborationRequestList = React.memo(
  ({
    collaboration_requests,
    has_more,
    load_more,
    collaboration_request_props = {},
    skeleton_props = {},
    className,
    ...rest
  }: VirtualizedCollaborationRequestListProps) => (
    <VirtualizedCollaborationRequestListContext.Provider
      value={{ collaboration_request_props, skeleton_props }}
    >
      <Virtuoso
        increaseViewportBy={750}
        scrollSeekConfiguration={{
          enter: (velocity): boolean => Math.abs(velocity) > 950,
          exit: (velocity): boolean => Math.abs(velocity) < 10
        }}
        useWindowScroll
        {...rest}
        className={clsx(css["full-w"], css["full-h"], className)}
        components={{
          ...rest?.components,
          Item: VirtualizedCollaborationRequestItem,
          ScrollSeekPlaceholder:
            VirtualizedCollaborationRequestScrollSeekPlaceholder,
          ...(has_more && { Footer: VirtualFooter })
        }}
        data={collaboration_requests}
        endReached={has_more ? load_more : (): void => undefined}
      />
    </VirtualizedCollaborationRequestListContext.Provider>
  )
);

VirtualizedCollaborationRequestList.displayName =
  "VirtualizedCollaborationRequestList";

export default VirtualizedCollaborationRequestList;
