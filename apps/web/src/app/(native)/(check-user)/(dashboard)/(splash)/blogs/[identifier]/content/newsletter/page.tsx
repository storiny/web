import "server-only";

import { notFound as not_found, redirect } from "next/navigation";
import React from "react";

import { get_blog, get_blog_newsletter_info } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";

import ContentNewsletterClient from "./client";

const Page = async ({
  params
}: {
  params: Promise<{ identifier: string }>;
}): Promise<React.ReactElement | undefined> => {
  try {
    const [{ identifier }, user_id] = await Promise.all([params, get_user()]);

    if (!user_id) {
      redirect(
        `/login?to=${encodeURIComponent(
          `/me/blogs/${identifier}/content/newsletter`
        )}`
      );
    }

    const blog = await get_blog({
      identifier,
      current_user_id: user_id
    });

    if (!blog.is_owner) {
      not_found();
    }

    const blog_newsletter_info_response = await get_blog_newsletter_info({
      identifier
    });

    return <ContentNewsletterClient {...blog_newsletter_info_response} />;
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
