import "server-only";

import { redirect, RedirectType } from "next/navigation";

import { get_username } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";

const Page = async (): Promise<void> => {
  try {
    const user_id = await get_user();

    if (!user_id) {
      redirect(`/login?to=${encodeURIComponent("/profile")}`);
    }

    const { username } = await get_username({ user_id });

    redirect(`/${username}`, RedirectType.replace);
  } catch (e) {
    handle_exception(e);
  }
};

export { metadata } from "./metadata";
export default Page;
