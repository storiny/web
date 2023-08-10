import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/password/add/request-verification";

export interface AddPasswordVerificationResponse {}

export const { useAddPasswordRequestVerificationMutation } =
  apiSlice.injectEndpoints({
    endpoints: (builder) => ({
      addPasswordRequestVerification: builder.mutation<
        AddPasswordVerificationResponse,
        void
      >({
        query: () => ({
          url: `/${SEGMENT}`,
          method: "POST"
        })
      })
    })
  });
