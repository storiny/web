import { mockAccountActivities } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/account-activity`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          mockAccountActivities.slice(0, 10).map((accountActivity) => ({
            ...accountActivity,
            id: nanoid(),
          }))
        )
      )
  )
);

export {};
