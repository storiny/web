import { mockUsers } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/validation/password`,
    async (req, res, ctx) => {
      return res(
        ctx.delay(750),
        ctx.status(200),
        ctx.json({ email: mockUsers[4].email })
      );
    }
  )
);

export {};
