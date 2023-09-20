import { mockTags } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;

worker.use(
  rest.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/public/tags`, (_, res, ctx) =>
    res(
      ctx.delay(1200),
      ctx.json(
        mockTags
          .slice(0, 5)
          .map((tag) => ({ value: tag.name, label: tag.name }))
      )
    )
  )
);

export {};
