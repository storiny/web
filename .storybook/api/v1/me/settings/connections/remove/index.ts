const { worker, rest } = window.msw;

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/settings/connections/:connectionId`,
    (_, res, ctx) => res(ctx.delay(750), ctx.status(204))
  )
);

export {};
