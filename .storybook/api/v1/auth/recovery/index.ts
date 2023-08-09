const { worker, rest } = window.msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/recovery`,
    async (req, res, ctx) => {
      return res(ctx.delay(750), ctx.status(200));
    }
  )
);

export {};
