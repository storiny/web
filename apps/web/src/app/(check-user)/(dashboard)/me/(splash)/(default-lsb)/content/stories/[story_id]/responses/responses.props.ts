import { GetStoryResponsesInfoResponse } from "~/common/grpc";

export type StoryResponsesProps = GetStoryResponsesInfoResponse & {
  story_id: string;
};
