"use client";

import React from "react";

import { BlogMemberRequestProps } from "~/entities/blog-member-request";

// Context for individual blog member request entities.
export const VirtualizedBlogMemberRequestListContext = React.createContext<
  Omit<Partial<BlogMemberRequestProps>, "role"> &
    Required<Pick<BlogMemberRequestProps, "role">>
>({ role: "editor" });
