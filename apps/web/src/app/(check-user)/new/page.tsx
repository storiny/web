import "server-only";

import { redirect } from "next/navigation";

import { create_draft } from "~/common/grpc";
import { handle_exception } from "~/common/grpc/utils";
import { get_user } from "~/common/utils/get-user";

const Page = async (): Promise<void> => {
  try {
    const user_id = await get_user();

    if (!user_id) {
      redirect("/login");
    }

    const draft_response = await create_draft({ user_id });

    redirect(`/doc/${draft_response.draft_id}`);
  } catch (e) {
    handle_exception(e);
  }
};

export * from "./metadata";
export default Page;
