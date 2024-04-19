"use client";

import React from "react";

import { GetBlogNewsletterInfoResponse } from "~/common/grpc";

export const BlogNewsletterInfoContext =
  React.createContext<GetBlogNewsletterInfoResponse>(
    {} as GetBlogNewsletterInfoResponse
  );

export const use_blog_newsletter_info_context =
  (): GetBlogNewsletterInfoResponse =>
    React.useContext(BlogNewsletterInfoContext);
