const { worker, rest } = window.msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/mfa-preflight`,
    async (req, res, ctx) => {
      return res(
        ctx.delay(750),
        ctx.json({
          mfa_enabled: true,
        }),
      );
    },
  ),
);

export {};
