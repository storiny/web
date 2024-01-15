import { appleStock as apple_stock } from "@visx/mock-data";
import { MOCK_STORIES, MOCK_USERS } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/stats/stories`,
    (req, res, ctx) =>
      res(
        ctx.delay(3500),
        ctx.json({
          latest_story_id: MOCK_STORIES[4].id,
          read_mercator: [
            ["JP", 245],
            ["IN", 128],
            ["CA", 366],
            ["DK", 17],
            ["HU", 199],
            ["MX", 16],
          ],
          read_timeline: apple_stock
            .slice(90, 180)
            .map(({ close, date }) => [date, Math.round(close)]),
          reading_time_last_month: 57732,
          reading_time_this_month: 64800,
          reads_last_month: 2992,
          reads_last_three_months: 5033,
          reads_this_month: 3201,
          referral_data: [
            ["Internal", 3002],
            ["twitter.com", 192],
            ["example.com", 232],
            ["google.com", 1023],
            ["bing.com", 393],
          ],
          returning_readers: 2219,
          total_reads: 8322,
          total_views: 13_022,
        }),
      ),
  ),
);

export {};
