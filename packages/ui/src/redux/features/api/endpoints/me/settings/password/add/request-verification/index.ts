import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/password/add/request-verification";

export const {
  useAddPasswordRequestVerificationMutation:
    use_add_password_request_verification_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    addPasswordRequestVerification: builder.mutation<void, void>({
      query: () => ({
        url: `/${SEGMENT}`,
        method: "POST"
      })
    })
  })
});
