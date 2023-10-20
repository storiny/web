const { worker, rest } = window.msw;

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/assets/:asset_id/alt`,
    (req, res, ctx) => res(ctx.delay(1200), ctx.status(204)),
  ),
);

export {};
