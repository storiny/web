import { User } from "@storiny/types";

import { api_slice } from "~/redux/features/api/slice";

const SEGMENT = "me/stats/account";

export type GetAccountStatsResponse = {
  follow_timeline: Record<string, number>;
  follows_last_month: number;
  follows_this_month: number;
  recent_followers: (User & { followed_at: string })[];
  total_followers: number;
  total_subscribers: number;
};

export const { useGetAccountStatsQuery: use_get_account_stats_query } =
  api_slice.injectEndpoints({
    endpoints: (builder) => ({
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      getAccountStats: builder.query<GetAccountStatsResponse, void>({
        query: () => `/${SEGMENT}`,
        serializeQueryArgs: ({ endpointName }) => endpointName
      })
    })
  });
