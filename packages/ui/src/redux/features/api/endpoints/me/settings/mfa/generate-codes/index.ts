import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/mfa/generate-codes";

export type GenerateCodesResponse = {
  used: boolean;
  value: string;
}[];

export const { useGenerateCodesMutation: use_generate_codes_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      generateCodes: builder.mutation<GenerateCodesResponse, void>({
        query: () => ({
          url: `/${SEGMENT}`,
          method: "POST"
        })
      })
    })
  });
