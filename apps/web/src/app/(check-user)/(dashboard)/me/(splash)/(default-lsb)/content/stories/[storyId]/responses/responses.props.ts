import { GetStoryResponsesInfoResponse } from "~/common/grpc";

export type StoryResponsesProps = GetStoryResponsesInfoResponse & {
  storyId: string;
};
