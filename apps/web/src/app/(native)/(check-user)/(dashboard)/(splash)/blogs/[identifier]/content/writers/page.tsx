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
  params: { identifier: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    const { identifier } = params;
    const user_id = await get_user();

    if (!user_id) {
      redirect(
        `/login?to=${encodeURIComponent(
          `/me/blogs/${identifier}/content/writers`
        )}`
      );
    }

    const blog_writers_info_response = await get_blog_writers_info({
      identifier
    });

    return <ContentWritersClient {...blog_writers_info_response} />;
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
