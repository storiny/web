import { MOCK_USERS } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

const get_random_user = () =>
  MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/flow/onboarding/writers`,
    (_, res, ctx) =>
      res(
        ctx.delay(750),
        ctx.json(
          Array(25)
            .fill({})
            .map(get_random_user)
            .map((user) => ({ ...user, id: nanoid() }))
        )
      )
  )
);

export {};
