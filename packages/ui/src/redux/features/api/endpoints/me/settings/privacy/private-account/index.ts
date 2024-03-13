import { ContentType } from "@storiny/shared";
import { PrivateAccountSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/account/privacy/site-safety/private-account";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/private-account";

export type PrivateAccountPayload = PrivateAccountSchema;

export const { usePrivateAccountMutation: use_private_account_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      privateAccount: builder.mutation<void, PrivateAccountPayload>({
        query: (body) => ({
          url: `/${SEGMENT}`,
          method: "PATCH",
          body,
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
