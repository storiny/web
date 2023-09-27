import { ContentType } from "@storiny/shared";
import { RemoveAccountSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/credentials/connected-accounts-group/remove-account";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/accounts/remove";

export type RemoveAccountPayload = RemoveAccountSchema & {
  vendor: "apple" | "google";
};

export const { useRemoveAccountMutation: use_remove_account_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      removeAccount: builder.mutation<void, RemoveAccountPayload>({
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
