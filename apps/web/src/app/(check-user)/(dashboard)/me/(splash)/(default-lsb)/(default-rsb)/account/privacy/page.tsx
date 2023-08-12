import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { getPrivacySettings } from "~/common/grpc";
import { handleException } from "~/common/grpc/utils";
import { getUser } from "~/common/utils/getUser";

import PrivacySettingsClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const userId = await getUser();

    if (!userId) {
      redirect("/login");
    }

    const privacySettingsResponse = await getPrivacySettings({ id: userId });

    return <PrivacySettingsClient {...privacySettingsResponse} />;
  } catch (e) {
    handleException(e);
  }
};

export default Page;
