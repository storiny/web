import { MOCK_USERS } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/followers`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          MOCK_USERS.slice(0, 10).map((user) => ({
            ...user,
            id: nanoid(),
            is_follower: true,
          }))
        )
      )
  )
);

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/following`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          MOCK_USERS.slice(0, 10).map((user) => ({
            ...user,
            id: nanoid(),
            is_following: true,
          }))
        )
      )
  )
);

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/friends`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          MOCK_USERS.slice(0, 10).map((user) => ({
            ...user,
            id: nanoid(),
            is_friend: true,
          }))
        )
      )
  )
);

export {};
