import { ContentType } from "@storiny/shared";
import { Remove2FASchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/credentials/2fa-settings/remove-2fa";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/mfa/remove";

export type RemoveMFAPayload = Remove2FASchema;

export const { useRemoveMfaMutation: use_remove_mfa_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      removeMfa: builder.mutation<void, RemoveMFAPayload>({
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
