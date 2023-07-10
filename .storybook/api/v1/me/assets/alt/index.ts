const { worker, rest } = (window as any).msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/assets/:assetId/alt`,
    (req, res, ctx) => res(ctx.delay(1200), ctx.status(200))
  )
);

export {};
