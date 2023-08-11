import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/password/update";

export interface UpdatePasswordResponse {}
export interface UpdatePasswordPayload {
  "current-password": string;
  "new-password": string;
}

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
