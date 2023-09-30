import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { get_followed_tag_count } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "src/common/utils/get-user";

import ContentTagsClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const user_id = await get_user();

    if (!user_id) {
      redirect("/login");
    }

    const followed_tag_count_response = await get_followed_tag_count({
      id: user_id
    });

    return <ContentTagsClient {...followed_tag_count_response} />;
  } catch (e) {
    handle_exception(e);
  }
};

export * from "./metadata";
export default Page;
