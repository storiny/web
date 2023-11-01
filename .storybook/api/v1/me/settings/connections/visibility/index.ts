const { worker, rest } = window.msw;

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/settings/connections/:connection_id/visibility`,
    (_, res, ctx) => res(ctx.delay(750), ctx.status(204)),
  ),
);

export {};
