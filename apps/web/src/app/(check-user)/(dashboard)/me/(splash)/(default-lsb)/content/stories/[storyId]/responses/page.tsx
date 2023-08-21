import "server-only";

import { notFound, redirect } from "next/navigation";
import React from "react";

import { getStoryResponsesInfo } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getUser } from "~/common/utils/getUser";
import { isSnowflake } from "~/common/utils/isSnowflake";

import ContentStoryResponsesClient from "./client";

const Page = async ({
  params: { storyId }
}: {
  params: { storyId: string };
}): Promise<React.ReactElement | undefined> => {
  try {
    if (!isSnowflake(storyId)) {
      notFound();
    }

    const userId = await getUser();

    if (!userId) {
      redirect("/login");
    }

    const storyResponsesInfoResponse = await getStoryResponsesInfo({
      user_id: userId,
      story_id: storyId
    });

    return (
      <ContentStoryResponsesClient
        {...storyResponsesInfoResponse}
        storyId={storyId}
      />
    );
  } catch (e) {
    handleException(e);
  }
};

export * from "./metadata";
export default Page;
