import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { get_blog_writers_info } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";

import ContentWritersClient from "./client";

const Page = async ({
  params
}: {
  params: { id_or_slug: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const { id_or_slug } = params;
    const user_id = await get_user();

    if (!user_id) {
      redirect(
        `/login?to=${encodeURIComponent(
          `/me/blogs/${id_or_slug}/content/writers`
        )}`
      );
    }

    const blog_writers_info_response = await get_blog_writers_info({
      identifier: id_or_slug
    });

    return <ContentWritersClient {...blog_writers_info_response} />;
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
