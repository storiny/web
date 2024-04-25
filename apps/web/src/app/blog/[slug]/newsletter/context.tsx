"use client";

import React from "react";

import { GetBlogNewsletterResponse } from "~/common/grpc";

export const BlogNewsletterInfoContext =
  React.createContext<GetBlogNewsletterResponse>(
    {} as GetBlogNewsletterResponse
  );

export const BlogNewsletterInfoContextProvider = ({
  response,
  children
}: {
  children?: React.ReactNode;
  response: GetBlogNewsletterResponse;
}): React.ReactElement => (
  <BlogNewsletterInfoContext.Provider value={response}>
    {children}
  </BlogNewsletterInfoContext.Provider>
);

export const use_blog_newsletter_info_context = (): GetBlogNewsletterResponse =>
  React.useContext(BlogNewsletterInfoContext);
