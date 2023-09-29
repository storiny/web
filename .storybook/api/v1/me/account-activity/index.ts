import { MOCK_ACCOUNT_ACTIVITIES } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/account-activity`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          MOCK_ACCOUNT_ACTIVITIES.slice(0, 10).map((account_activity) => ({
            ...account_activity,
            id: nanoid(),
          }))
        )
      )
  )
);

export {};
