import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { getResponsesInfo } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getUser } from "~/common/utils/getUser";

import ContentResponsesClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const userId = await getUser();

    if (!userId) {
      redirect("/login");
    }

    const responsesInfoResponse = await getResponsesInfo({
      id: userId
    });

    return <ContentResponsesClient {...responsesInfoResponse} />;
  } catch (e) {
    handleException(e);
  }
};

export * from "./metadata";
export default Page;
