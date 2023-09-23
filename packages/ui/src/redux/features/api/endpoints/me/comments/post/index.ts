import { ContentType } from "@storiny/shared";

import {
  incrementAction,
  setSelfCommentCount,
  setStoryCommentCount
} from "~/redux/features";
import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/comments";

export interface CommentAddResponse {}
export interface CommentAddPayload {
  content: string;
  storyId: string;
}

export const { useAddCommentMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addComment: builder.mutation<CommentAddResponse, CommentAddPayload>({
      query: (body) => ({
        url: `/${SEGMENT}`,
        method: "POST",
        body,
        headers: {
          "Content-type": ContentType.JSON
        }
      }),
      invalidatesTags: ["Comment"],
      onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
        queryFulfilled.then(() => {
          dispatch(setStoryCommentCount([arg.storyId, incrementAction]));
          dispatch(setSelfCommentCount(incrementAction));
        });
      }
    })
  })
});
