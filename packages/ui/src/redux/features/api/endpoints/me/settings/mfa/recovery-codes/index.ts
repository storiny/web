import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/mfa/recovery-codes";

export type RecoveryCodesResponse = {
  used: boolean;
  value: string;
}[];

export const { useRecoveryCodesMutation: use_recovery_codes_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      recoveryCodes: builder.mutation<RecoveryCodesResponse, void>({
        query: () => ({
          url: `/${SEGMENT}`,
          method: "GET"
        })
      })
    })
  });
