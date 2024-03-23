import { ContentType } from "@storiny/shared";
import { AccountActionSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/account/credentials/connected-accounts-group/account-action.schema";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = (vendor: "apple" | "google"): string =>
  `me/settings/accounts/add/${vendor}`;

export type AddAccountPayload = AccountActionSchema & {
  vendor: "apple" | "google";
};
export type AddAccountResponse = { url: string };

export const { useAddAccountMutation: use_add_account_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      addAccount: builder.mutation<AddAccountResponse, AddAccountPayload>({
        query: ({ vendor, ...rest }) => ({
          url: `/${SEGMENT(vendor)}`,
          method: "POST",
          body: rest,
          headers: {
            "Content-type": ContentType.JSON
          }
        })
      })
    })
  });
