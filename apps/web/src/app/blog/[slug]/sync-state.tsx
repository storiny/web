"use client";

import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { sync_with_blog } from "~/redux/features";
import { use_app_dispatch } from "~/redux/hooks";

const SyncBlogState = (): null => {
  const blog = use_blog_context();
  const dispatch = use_app_dispatch();

  React.useEffect(() => {
    dispatch(sync_with_blog(blog));
  }, [blog, dispatch]);

  return null;
};

export default SyncBlogState;
