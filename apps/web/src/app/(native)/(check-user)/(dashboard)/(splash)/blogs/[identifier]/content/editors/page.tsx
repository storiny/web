import "server-only";

import { notFound as not_found, redirect } from "next/navigation";
import React from "react";

import { get_blog, get_blog_editors_info } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";

import ContentEditorsClient from "./client";

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
          `/me/blogs/${identifier}/content/editors`
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

    const blog_editors_info_response = await get_blog_editors_info({
      identifier
    });

    return <ContentEditorsClient {...blog_editors_info_response} />;
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
