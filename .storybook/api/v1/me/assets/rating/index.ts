const { worker, rest } = window.msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/assets/:asset_id/rating`,
    (req, res, ctx) => res(ctx.delay(1200), ctx.status(204)),
  ),
);

export {};
