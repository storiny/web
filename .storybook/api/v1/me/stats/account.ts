import { appleStock as apple_stock } from "@visx/mock-data";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/stats/account`,
    (req, res, ctx) =>
      res(
        ctx.delay(3500),
        ctx.json({
          follow_timeline: apple_stock
            .slice(0, 90)
            .map(({ close, date }) => [date, Math.round(close)]),
          follows_last_month: 224,
          follows_this_month: 356,
          total_followers: 1600,
          total_subscribers: 1224,
        }),
      ),
  ),
);

export {};
