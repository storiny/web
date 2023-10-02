import { ContentType } from "@storiny/shared";
import { UserStatus } from "@storiny/types";

import { SetStatusSchema } from "~/entities/status/modal/schema";
import { mutate_user } from "~/redux/features";
import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/status";

export type SetStatusPayload = SetStatusSchema | null;
export type SetStatusResponse = UserStatus;

export const { useSetStatusMutation: use_set_status_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      setStatus: builder.mutation<SetStatusResponse, SetStatusPayload>({
        query: (body) => ({
          url: `/${SEGMENT}`,
          method: body === null ? "DELETE" : "POST",
          ...(body !== null
            ? {
                body,
                headers: {
                  "Content-type": ContentType.JSON
                }
              }
            : {})
        }),
        onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
          queryFulfilled.then((response) => {
            dispatch(
              mutate_user({ status: arg === null ? null : response.data })
            );
          });
        }
      })
    })
  });
