import { GetStoryResponse } from "~/common/grpc";

export interface RestrictedStoryProps {
  type: "user-blocked" | "unpublished";
  user: NonNullable<GetStoryResponse["user"]>;
}
