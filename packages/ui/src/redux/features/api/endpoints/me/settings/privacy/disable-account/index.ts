import { ContentType } from "@storiny/shared";
import { DisableAccountSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/account/privacy/site-safety/account-removal/disable-account";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/disable-account";

export type DisableAccountPayload = DisableAccountSchema;

export const { useDisableAccountMutation: use_disable_account_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      disableAccount: builder.mutation<void, DisableAccountPayload>({
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
