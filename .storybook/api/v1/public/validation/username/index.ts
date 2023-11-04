const { worker, rest } = window.msw;

const unavailableUsernames = ["taken", "some"];

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/public/validation/username`,
    async (req, res, ctx) => {
      const { username } = await req.json();

      if (unavailableUsernames.includes(username)) {
        return res(ctx.delay(750), ctx.status(400));
      }

      return res(ctx.delay(750), ctx.status(200));
    },
  ),
);

export {};
