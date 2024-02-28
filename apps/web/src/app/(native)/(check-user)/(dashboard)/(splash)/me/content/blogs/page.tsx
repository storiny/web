import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { get_user_blogs_info } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";

import ContentBlogsClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const user_id = await get_user();

    if (!user_id) {
      redirect(`/login?to=${encodeURIComponent("/me/content/blogs")}`);
    }

    const user_blogs_info_response = await get_user_blogs_info({
      user_id
    });

    return <ContentBlogsClient {...user_blogs_info_response} />;
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
