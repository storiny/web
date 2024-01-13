import { appleStock as apple_stock } from "@visx/mock-data";

const { worker, rest } = window.msw;

const read_timeline: Record<string, number> = {};
const like_timeline: Record<string, number> = {};
const reading_time_timeline: Record<string, number> = {};

for (const stock of apple_stock.slice(90, 180)) {
  read_timeline[stock.date] = Math.round(stock.close);
}

for (const stock of apple_stock.slice(180, 270)) {
  like_timeline[stock.date] = Math.round(stock.close);
}

for (const stock of apple_stock.slice(0, 90)) {
  reading_time_timeline[stock.date] = Math.round(stock.close);
}

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/stories/:story_id/stats`,
    (req, res, ctx) =>
      res(
        ctx.delay(3500),
        ctx.json({
          comments_last_month: 19,
          comments_this_month: 24,
          device_map: {
            Desktop: 2883,
            Mobile: 499,
            Tablet: 54,
          },
          like_timeline,
          likes_last_month: 64,
          likes_this_month: 82,
          read_mercator: { JP: 245, IN: 128, CA: 366, DK: 17, HU: 199, MX: 12 },
          read_timeline,
          reading_time_average: 960,
          reading_time_estimate: 865,
          reading_time_last_month: 57732,
          reading_time_this_month: 64800,
          reading_time_timeline,
          reads_last_month: 2992,
          reads_last_three_months: 5033,
          reads_this_month: 3201,
          referral_map: {
            Internal: 3002,
            "twitter.com": 192,
            "example.com": 232,
            "google.com": 1023,
            "bing.com": 392,
          },
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
