import { mockUsers } from "@storiny/ui/src/mocks";
const { worker, rest } = window.msw;

worker.use(
  rest.patch(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/settings/banner`,
    async (req, res, ctx) => {
      return res(
        ctx.delay(750),
        ctx.status(200),
        ctx.json({
          avatar_id: mockUsers[6].banner_id,
          avatar_hex: mockUsers[6].banner_hex,
        })
      );
    }
  )
);

export {};
