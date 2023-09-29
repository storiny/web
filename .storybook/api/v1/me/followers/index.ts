const { worker, rest } = window.msw;

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/followers/:user_id`,
    (_, res, ctx) => res(ctx.delay(750), ctx.status(204))
  )
);

export {};
