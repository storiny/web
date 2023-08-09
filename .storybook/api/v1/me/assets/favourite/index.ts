const { worker, rest } = window.msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/assets/:assetId/favourite`,
    (req, res, ctx) => res(ctx.delay(1200), ctx.status(200))
  )
);

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/assets/:assetId/favourite`,
    (req, res, ctx) => res(ctx.delay(1200), ctx.status(200))
  )
);

export {};
