import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { getPrivacySettings } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getUser } from "~/common/utils/getUser";

import PrivacySettingsClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const user_id = await getUser();

    if (!user_id) {
      redirect("/login");
    }

    const privacySettingsResponse = await getPrivacySettings({ id: user_id });

    return <PrivacySettingsClient {...privacySettingsResponse} />;
  } catch (e) {
    handleException(e);
  }
};

export * from "./metadata";
export default Page;
