import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { get_responses_info } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "src/common/utils/get-user";

import ContentResponsesClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const user_id = await get_user();

    if (!user_id) {
      redirect("/login");
    }

    const responses_info_response = await get_responses_info({
      id: user_id
    });

    return <ContentResponsesClient {...responses_info_response} />;
  } catch (e) {
    handle_exception(e);
  }
};

export * from "./metadata";
export default Page;
