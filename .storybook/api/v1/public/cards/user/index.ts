import { MOCK_USERS } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/public/cards/user/:identifier`,
    (req, res, ctx) => {
      const { identifier } = req.params;
      return res(
        ctx.delay(2500),
        ctx.json(
          MOCK_USERS.find(
            (user) => user.id === identifier || user.username === identifier,
          ) || MOCK_USERS[4],
        ),
      );
    },
  ),
);

export {};
