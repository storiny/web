import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/drafts/${id}/recover`;

export interface DraftRecoverResponse {}
export interface DraftRecoverPayload {
  id: string;
}

export const { useDraftRecoverMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    draftRecover: builder.mutation<DraftRecoverResponse, DraftRecoverPayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "POST"
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Story", id: arg.id }]
    })
  })
});
