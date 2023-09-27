import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/mfa/request";

export interface RequestMFAResponse {
  code: string;
  qr: string;
}

export const { useRequestMfaMutation: use_request_mfa_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      requestMfa: builder.mutation<RequestMFAResponse, void>({
        query: () => ({
          url: `/${SEGMENT}`,
          method: "GET"
        })
      })
    })
  });
