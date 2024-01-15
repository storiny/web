import { appleStock as apple_stock } from "@visx/mock-data";
import { DeviceType } from "@storiny/shared";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/stories/:story_id/stats`,
    (req, res, ctx) =>
      res(
        ctx.delay(3500),
        ctx.json({
          comments_last_month: 19,
          comments_this_month: 24,
          device_data: [
            [DeviceType.COMPUTER, 2883],
            [DeviceType.MOBILE, 499],
            [DeviceType.TABLET, 54],
          ],
          like_timeline: apple_stock
            .slice(180, 270)
            .map(({ date, close }) => [date, Math.round(close)]),
          likes_last_month: 64,
          likes_this_month: 82,
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
            .map(({ date, close }) => [date, Math.round(close)]),
          reading_time_average: 960,
          reading_time_estimate: 865,
          reading_time_last_month: 57732,
          reading_time_this_month: 64800,
          reading_time_timeline: apple_stock
            .slice(0, 90)
            .map(({ date, close }) => [date, Math.round(close)]),
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
          total_comments: 102,
          total_likes: 2399,
          total_reads: 8322,
          total_views: 13_022,
        }),
      ),
  ),
);

export {};
