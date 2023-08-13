import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/settings/connections/${id}`;

export interface RemoveConnectionResponse {}
export interface RemoveConnectionPayload {
  id: string;
}

export const { useRemoveConnectionMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    removeConnection: builder.mutation<
      RemoveConnectionResponse,
      RemoveConnectionPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "DELETE"
      })
    })
  })
});
