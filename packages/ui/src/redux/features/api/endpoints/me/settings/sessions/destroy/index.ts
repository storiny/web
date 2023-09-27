import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/settings/sessions/destroy";

export const { useDestroySessionsMutation: use_destroy_sessions_mutation } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      destroySessions: builder.mutation<void, void>({
        query: () => ({
          url: `/${SEGMENT}`,
          method: "POST"
        })
      })
    })
  });
