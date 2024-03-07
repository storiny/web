import "server-only";

import { notFound as not_found, redirect } from "next/navigation";
import React from "react";

import { use_blog_context } from "~/common/context/blog";
import { get_blog_editors_info } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";

import ContentEditorsClient from "./client";

const Page = async ({
  params
}: {
  params: { id_or_slug: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const { id_or_slug } = params;
    const blog = use_blog_context();

    if (blog.role !== "owner") {
      not_found();
    }

    const user_id = await get_user();

    if (!user_id) {
      redirect(
        `/login?to=${encodeURIComponent(
          `/me/blogs/${id_or_slug}/content/editors`
        )}`
      );
    }

    const blog_editors_info_response = await get_blog_editors_info({
      identifier: id_or_slug
    });

    return <ContentEditorsClient {...blog_editors_info_response} />;
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
