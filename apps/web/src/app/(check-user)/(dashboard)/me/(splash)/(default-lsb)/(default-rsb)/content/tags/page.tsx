import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { getFollowedTagCount } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getUser } from "~/common/utils/getUser";

import ContentTagsClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const user_id = await getUser();

    if (!user_id) {
      redirect("/login");
    }

    const followedTagCountResponse = await getFollowedTagCount({
      id: user_id
    });

    return <ContentTagsClient {...followedTagCountResponse} />;
  } catch (e) {
    handleException(e);
  }
};

export * from "./metadata";
export default Page;
