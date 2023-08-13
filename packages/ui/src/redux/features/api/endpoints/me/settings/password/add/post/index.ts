import { ContentType } from "@storiny/shared";
import { AddPasswordSchema } from "@storiny/web/src/app/(check-user)/(dashboard)/me/(splash)/(default-lsb)/(default-rsb)/account/credentials/password-settings/add-password";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/password/add";

export interface AddPasswordResponse {}
export type AddPasswordPayload = AddPasswordSchema;

export const { useAddPasswordMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    addPassword: builder.mutation<AddPasswordResponse, AddPasswordPayload>({
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
