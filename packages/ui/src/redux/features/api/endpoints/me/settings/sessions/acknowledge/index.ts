import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/sessions/acknowledge";

export type SessionAcknowledgePayload = {
  id: string;
};

export const {
  useAcknowledgeSessionMutation: use_acknowledge_session_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    acknowledgeSession: builder.mutation<void, SessionAcknowledgePayload>({
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
