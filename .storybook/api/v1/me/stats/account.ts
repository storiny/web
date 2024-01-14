import { appleStock as apple_stock } from "@visx/mock-data";

const { worker, rest } = window.msw;

const follow_timeline: Record<string, number> = {};

for (const stock of apple_stock.slice(0, 90)) {
  follow_timeline[stock.date] = Math.round(stock.close);
}

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/stats/account`,
    (req, res, ctx) =>
      res(
        ctx.delay(3500),
        ctx.json({
          follow_timeline,
          follows_last_month: 224,
          follows_this_month: 356,
          total_followers: 1600,
          total_subscribers: 1224,
        }),
      ),
  ),
);

export {};
