import "./favourite";
import "./alt";
import "./rating";

import { mockAssets } from "@storiny/ui/src/mocks";
import { nanoid } from "nanoid";

const { worker, rest } = (window as any).msw;

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/assets`,
    (req, res, ctx) =>
      res(ctx.delay(3400), ctx.status(201), ctx.json(mockAssets[0]))
  )
);

worker.use(
  rest.get(`${process.env.NEXT_PUBLIC_API_URL}/v1/me/assets`, (req, res, ctx) =>
    res(
      ctx.delay(1200),
      ctx.json(
        mockAssets.slice(0, 15).map((asset) => ({ ...asset, id: nanoid() }))
      )
    )
  )
);

worker.use(
  rest.delete(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/assets/:assetId`,
    (req, res, ctx) => res(ctx.delay(1200), ctx.status(200))
  )
);

export {};
