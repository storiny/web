import { ContentType } from "@storiny/shared";
import { LoginSchema } from "@storiny/web/src/app/(native)/(auth)/auth/(segmented)/@login/schema";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "auth/mfa-preflight";

export interface MfaPreflightResponse {
  mfa_enabled: boolean;
}

export type MfaPreflightPayload = Omit<LoginSchema, "remember_me">;

export const { useMfaPreflightMutation: use_mfa_preflight_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      mfaPreflight: builder.mutation<MfaPreflightResponse, MfaPreflightPayload>(
        {
          query: (body) => ({
            url: `/${SEGMENT}`,
            method: "POST",
            body,
            headers: {
              "Content-type": ContentType.JSON
            }
          })
        }
      )
    })
  });
