import { ContentType } from "@storiny/shared";
import { AddPasswordSchema } from "@storiny/web/src/app/(native)/(check-user)/(dashboard)/(splash)/me/(default-rsb)/account/credentials/password-settings/add-password";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/password/add";

export type AddPasswordPayload = AddPasswordSchema;

export const { useAddPasswordMutation: use_add_password_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      addPassword: builder.mutation<void, AddPasswordPayload>({
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
