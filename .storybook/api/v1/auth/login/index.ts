const { worker, rest } = window.msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/auth/login`,
    async (req, res, ctx) => {
      return res(
        ctx.delay(750),
        ctx.json({
          result: "success",
        })
      );
    }
  )
);

export {};
