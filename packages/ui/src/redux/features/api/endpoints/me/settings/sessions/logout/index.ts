import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (id: string): string => `me/settings/sessions/${id}/logout`;

export type SessionLogoutPayload = {
  id: string;
};

export const { useSession_logoutMutation: use_session_logout_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      session_logout: builder.mutation<void, SessionLogoutPayload>({
        query: (body) => ({
          url: `/${SEGMENT(body.id)}`,
          method: "DELETE"
        })
      })
    })
  });
