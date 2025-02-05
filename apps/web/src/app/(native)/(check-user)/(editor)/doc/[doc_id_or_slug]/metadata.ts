import { Status } from "@grpc/grpc-js/build/src/constants";
import { captureException as capture_exception } from "@sentry/nextjs";
import type { Metadata } from "next";

import { get_story_metadata } from "~/common/grpc";
import { get_user } from "~/common/utils/get-user";

export const generateMetadata = async ({
  params
}: {
  params: Promise<{ doc_id_or_slug: string }>;
}): Promise<Metadata> => {
  try {
    const [{ doc_id_or_slug }, user_id] = await Promise.all([
      params,
      get_user()
    ]);
    const story_metadata_response = await get_story_metadata({
      id_or_slug: doc_id_or_slug,
      user_id: user_id || ""
    });

    return {
      title: `Editing ${story_metadata_response.title || "document"}`,
      robots: { follow: false, index: false }
    };
  } catch (err) {
    const err_code = err?.code;

    if (err_code !== Status.NOT_FOUND && err_code !== Status.UNAUTHENTICATED) {
      capture_exception(err);
    }

    return {
      title: "Editing document",
      robots: { follow: false, index: false }
    };
  }
};
