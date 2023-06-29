import { mockUsers } from "@storiny/ui/src/mocks";

const { worker, rest } = (window as any).msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/tag/:tagName/writers`,
    (req, res, ctx) => res(ctx.delay(1200), ctx.json(mockUsers.slice(0, 5)))
  )
);

export {};
