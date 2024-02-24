import "server-only";

import { ServiceError } from "@grpc/grpc-js";
import { Status } from "@grpc/grpc-js/build/src/constants";
import { redirect } from "next/navigation";
import React from "react";

import { create_draft } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";

import DocRateLimit from "./rate-limit";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const user_id = await get_user();

    if (!user_id) {
      redirect("/login");
    }

    const draft_response = await create_draft({ user_id });

    redirect(`/doc/${draft_response.draft_id}`);
  } catch (e) {
    const err_code = (e as ServiceError | undefined)?.code;

    // Daily resource limit reached.
    if (err_code === Status.RESOURCE_EXHAUSTED) {
      return <DocRateLimit />;
    }

    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
