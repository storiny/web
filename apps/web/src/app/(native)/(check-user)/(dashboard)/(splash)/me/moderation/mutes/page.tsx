import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { get_user_mute_count } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";

import ModerationMutesClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const user_id = await get_user();

    if (!user_id) {
      redirect(`/login?to=${encodeURIComponent("/me/moderation/mutes")}`);
    }

    const mute_count_response = await get_user_mute_count({
      user_id
    });

    return <ModerationMutesClient {...mute_count_response} />;
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
