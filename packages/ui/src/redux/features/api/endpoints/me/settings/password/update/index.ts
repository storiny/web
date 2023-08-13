import { ContentType } from "@storiny/shared";
import { UpdatePasswordSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/credentials/password-settings/update-password";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/password/update";

export interface UpdatePasswordResponse {}
export type UpdatePasswordPayload = UpdatePasswordSchema;

export const { useUpdatePasswordMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    updatePassword: builder.mutation<
      UpdatePasswordResponse,
      UpdatePasswordPayload
    >({
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
