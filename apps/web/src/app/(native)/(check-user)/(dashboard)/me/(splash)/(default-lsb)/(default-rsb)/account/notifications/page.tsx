import "server-only";

import { redirect } from "next/navigation";
import React from "react";

import { get_notification_settings } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";

import NotificationSettingsClient from "./client";

const Page = async (): Promise<React.ReactElement | undefined> => {
  try {
    const user_id = await get_user();

    if (!user_id) {
      redirect(`/login?to=${encodeURIComponent("/me/account/notifications")}`);
    }

    const notification_settings_response = await get_notification_settings({
      user_id
    });

    return <NotificationSettingsClient {...notification_settings_response} />;
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
