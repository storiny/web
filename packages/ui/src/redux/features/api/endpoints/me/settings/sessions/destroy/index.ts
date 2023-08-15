import { apiSlice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/sessions/destroy";

export interface DestroySessionsResponse {}

export const { useDestroySessionsMutation } = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    destroySessions: builder.mutation<DestroySessionsResponse, void>({
      query: () => ({
        url: `/${SEGMENT}`,
        method: "POST"
      })
    })
  })
});
