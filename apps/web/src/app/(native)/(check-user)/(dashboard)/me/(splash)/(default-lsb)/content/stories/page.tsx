import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { get_stories_info } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";

import ContentStoriesClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const user_id = await get_user();

    if (!user_id) {
      redirect(`/login?to=${encodeURIComponent("/me/content/stories")}`);
    }

    const stories_info_response = await get_stories_info({
      user_id
    });

    return <ContentStoriesClient {...stories_info_response} />;
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
