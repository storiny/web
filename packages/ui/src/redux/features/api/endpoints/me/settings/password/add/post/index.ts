import { ContentType } from "@storiny/shared";

import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/password/add";

export interface AddPasswordResponse {}
export interface AddPasswordPayload {
  "new-password": string;
  "verification-code": string;
}

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
