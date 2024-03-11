"use client";

import { BlogMemberRequest as TBlogMemberRequest } from "@storiny/types";
import React from "react";
import { ItemProps } from "react-virtuoso";

import Divider from "~/components/divider";
import BlogMemberRequest from "~/entities/blog-member-request";
import css from "~/theme/main.module.scss";

import { VirtualizedBlogMemberRequestListContext } from "../list/list-context";

const VirtualizedBlogMemberRequestItem = React.memo(
  ({ item, ...rest }: ItemProps<TBlogMemberRequest>) => {
    // Props from context
    const blog_member_request_props = React.useContext(
      VirtualizedBlogMemberRequestListContext
    );
    return (
      <div {...rest} className={css["flex-col"]}>
        <BlogMemberRequest
          {...blog_member_request_props}
          blog_member_request={item}
        />
        <Divider style={{ marginInline: "var(--grid-compensation)" }} />
      </div>
    );
  }
);

VirtualizedBlogMemberRequestItem.displayName =
  "VirtualizedBlogMemberRequestItem";

export default VirtualizedBlogMemberRequestItem;
