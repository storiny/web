import { mockUsers } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = (window as any).msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/public/explore/writers`,
    (req, res, ctx) =>
      res(
        ctx.delay(1200),
        ctx.json(
          mockUsers.slice(0, 10).map((user) => ({ ...user, id: nanoid() }))
        )
      )
  )
);

export {};
