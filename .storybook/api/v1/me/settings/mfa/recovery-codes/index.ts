const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/settings/mfa/recovery-codes`,
    async (req, res, ctx) => {
      return res(
        ctx.delay(750),
        ctx.json([...Array(12)].map(() => `0000 0000`))
      );
    }
  )
);

export {};
