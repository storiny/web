const { worker, rest } = (window as any).msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/unread-notifications`,
    (req, res, ctx) => res(ctx.delay(1200), ctx.json(8))
  )
);

export {};
