import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/notifications/read-all";

export const {
  useReadAllNotificationsMutation: use_read_all_notifications_mutation
} = api_slice.injectEndpoints({
  endpoints: (builder) => ({
    readAllNotifications: builder.mutation<void, void>({
      query: () => ({
        url: `/${SEGMENT}`,
        method: "POST"
      })
    })
  })
});
