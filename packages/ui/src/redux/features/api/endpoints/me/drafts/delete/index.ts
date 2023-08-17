import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/drafts/${id}`;

export interface DraftDeleteResponse {}
export interface DraftDeletePayload {
  id: string;
}

export const { useDraftDeleteMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    draftDelete: builder.mutation<DraftDeleteResponse, DraftDeletePayload>({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "DELETE"
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Story", id: arg.id }]
    })
  })
});
