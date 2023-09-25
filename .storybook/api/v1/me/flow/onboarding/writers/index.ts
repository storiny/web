import { mockUsers } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

const getRandomUser = () =>
  mockUsers[Math.floor(Math.random() * mockUsers.length)];

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/flow/onboarding/writers`,
    (_, res, ctx) =>
      res(
        ctx.delay(750),
        ctx.json(
          Array(25)
            .fill(getRandomUser())
            .map((user) => ({ ...user, id: nanoid() }))
        )
      )
  )
);

export {};
