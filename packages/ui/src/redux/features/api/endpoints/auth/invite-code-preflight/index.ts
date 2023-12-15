import { ContentType } from "@storiny/shared";

import { api_slice } from "~/redux/features/api/slice";

// TODO: Remove after alpha

const SEGMENT = "auth/invite-code-preflight";

export interface InviteCodePreflightResponse {
  is_valid: boolean;
}

export type InviteCodePreflightPayload = { alpha_invite_code: string };

export const {
  useInviteCodePreflightMutation: use_invite_code_preflight_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    inviteCodePreflight: builder.mutation<
      InviteCodePreflightResponse,
      InviteCodePreflightPayload
    >({
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
