import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/mfa/recovery-codes";

export type RecoveryCodesResponse = {
  used: boolean;
  value: string;
}[];

export const { useRecoveryCodesMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    recoveryCodes: builder.mutation<RecoveryCodesResponse, void>({
      query: () => ({
        url: `/${SEGMENT}`,
        method: "GET"
      })
    })
  })
});
