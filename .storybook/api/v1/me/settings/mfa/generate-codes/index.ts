const { worker, rest } = window.msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/settings/mfa/generate-codes`,
    async (req, res, ctx) => {
      return res(
        ctx.delay(750),
        ctx.json(
          [...Array(10)].map((_, index) => ({
            used: index % 2 === 0,
            value: "0".repeat(12),
          })),
        ),
      );
    },
  ),
);

export {};
