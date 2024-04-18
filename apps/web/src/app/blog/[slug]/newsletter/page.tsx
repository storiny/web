import "server-only";

import { notFound as not_found } from "next/dist/client/components/not-found";
import React from "react";

import { get_blog_newsletter_info } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";
import { is_valid_blog_slug } from "~/common/utils/is-valid-blog-slug";

import Client from "./client";

const Page = async ({
  params
}: {
  params: { slug: string };
}): Promise<React.ReactElement | undefiend> => {
  try {
    if (!is_valid_blog_slug(params.slug)) {
      not_found();
    }

    const user_id = await get_user();
    const response = await get_blog_newsletter_info({
      identifier: params.slug,
      current_user_id: user_id || undefined
    });

    return <Client {...response} />;
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
