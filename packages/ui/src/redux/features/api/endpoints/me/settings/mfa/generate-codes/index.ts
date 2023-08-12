import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/mfa/generate-codes";

export type GenerateCodesResponse = {
  used: boolean;
  value: string;
}[];

export const { useGenerateCodesMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    generateCodes: builder.mutation<GenerateCodesResponse, void>({
      query: () => ({
        url: `/${SEGMENT}`,
        method: "POST"
      })
    })
  })
});
