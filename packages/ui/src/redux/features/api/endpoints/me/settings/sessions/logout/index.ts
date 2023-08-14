import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/settings/sessions/${id}/logout`;

export interface SessionLogoutResponse {}
export type SessionLogoutPayload = {
  id: string;
};

export const { useSessionLogoutMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    sessionLogout: builder.mutation<
      SessionLogoutResponse,
      SessionLogoutPayload
    >({
      query: (body) => ({
        url: `/${SEGMENT(body.id)}`,
        method: "DELETE"
      })
    })
  })
});
