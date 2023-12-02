import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { get_connection_settings } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";

import ConnectionSettingsClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const user_id = await get_user();

    if (!user_id) {
      redirect("/login");
    }

    const connection_settings_response = await get_connection_settings({
      user_id
    });

    return <ConnectionSettingsClient {...connection_settings_response} />;
  } catch (e) {
    handle_exception(e);
  }
};

export * from "./metadata";
export default Page;
