import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/sessions/logout";

export type SessionLogoutPayload = {
  id: string;
};

export const { useSessionLogoutMutation: use_session_logout_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      sessionLogout: builder.mutation<void, SessionLogoutPayload>({
        query: (body) => ({
          url: `/${SEGMENT}`,
          method: "POST",
          body,
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
