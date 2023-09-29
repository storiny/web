import { MOCK_NOTIFICATIONS } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/notifications`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          MOCK_NOTIFICATIONS.slice(0, 10).map((notification) => ({
            ...notification,
            id: nanoid(),
          }))
        )
      )
  )
);

export {};
