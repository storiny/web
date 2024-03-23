import { GetDraftsInfoResponse } from "~/common/grpc";

export type DraftProps = {
  latest_draft: NonNullable<GetDraftsInfoResponse["latest_draft"]>;
};
