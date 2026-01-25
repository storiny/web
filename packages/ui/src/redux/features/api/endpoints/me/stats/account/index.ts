import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/stats/account";

export type GetAccountStatsRequest = { user_id: string };

export type GetAccountStatsResponse = {
  follow_timeline: [string, number][];
  follows_last_month: number;
  follows_this_month: number;
  total_followers: number;
  total_subscribers: number;
};

export const { useGetAccountStatsQuery: use_get_account_stats_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      getAccountStats: builder.query<
        GetAccountStatsResponse,
        GetAccountStatsRequest
      >({
        query: ({ user_id }) => ({
          url: `/${SEGMENT}`,
          headers: { "x-storiny-uid": user_id }
        }),
        serializeQueryArgs: ({ endpointName }) => endpointName
      })
    })
  });
