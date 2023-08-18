import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { getStoriesInfo } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getUser } from "~/common/utils/getUser";

import ContentStoriesClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const userId = await getUser();

    if (!userId) {
      redirect("/login");
    }

    const storiesInfoResponse = await getStoriesInfo({
      id: userId
    });

    return <ContentStoriesClient {...storiesInfoResponse} />;
  } catch (e) {
    handleException(e);
  }
};

export * from "./metadata";
export default Page;
