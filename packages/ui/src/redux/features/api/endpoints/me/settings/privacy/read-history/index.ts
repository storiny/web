import { ContentType } from "@storiny/shared";
import { AccountHistorySchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/privacy/site-safety/account-history";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/privacy/read-history";

export type ReadHistoryPayload = AccountHistorySchema;

export const { useReadHistoryMutation: use_read_history_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      readHistory: builder.mutation<void, ReadHistoryPayload>({
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
