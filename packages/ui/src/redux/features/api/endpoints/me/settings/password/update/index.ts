import { ContentType } from "@storiny/shared";
import { UpdatePasswordSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/account/credentials/password-settings/update-password";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/password/update";

export type UpdatePasswordPayload = UpdatePasswordSchema;

export const { useUpdatePasswordMutation: use_update_password_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      updatePassword: builder.mutation<void, UpdatePasswordPayload>({
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
