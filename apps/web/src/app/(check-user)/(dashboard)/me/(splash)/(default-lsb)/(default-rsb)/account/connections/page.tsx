import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { getConnectionSettings } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getUser } from "~/common/utils/getUser";

import ConnectionSettingsClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const userId = await getUser();

    if (!userId) {
      redirect("/login");
    }

    const connectionSettingsResponse = await getConnectionSettings({
      id: userId
    });

    return <ConnectionSettingsClient {...connectionSettingsResponse} />;
  } catch (e) {
    handleException(e);
  }
};

export default Page;
