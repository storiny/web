import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/mfa/request";

export interface RequestMFAResponse {
  code: string;
  qr: string;
}

export const { useRequestMfaMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    requestMfa: builder.mutation<RequestMFAResponse, void>({
      query: () => ({
        url: `/${SEGMENT}`,
        method: "GET"
      })
    })
  })
});
