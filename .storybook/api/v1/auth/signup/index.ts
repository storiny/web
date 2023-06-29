const { worker, rest } = (window as any).msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/signup`,
    async (req, res, ctx) => {
      return res(ctx.delay(750), ctx.status(200));
    }
  )
);

export {};
