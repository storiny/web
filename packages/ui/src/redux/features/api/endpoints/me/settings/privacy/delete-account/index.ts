import { ContentType } from "@storiny/shared";
import { DeleteAccountSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/account/privacy/site-safety/account-removal/delete-account";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/delete-account";

export type DeleteAccountPayload = DeleteAccountSchema;

export const { useDeleteAccountMutation: use_delete_account_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      deleteAccount: builder.mutation<void, DeleteAccountPayload>({
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
