import { qrImage } from "./qr-code";

const { worker, rest } = window.msw;

const CODE = "0000 0000 0000 0000";

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/settings/mfa/request`,
    async (req, res, ctx) => {
      const image = `data:image/svg+xml;base64,${btoa(qrImage)}`;
      return res(ctx.delay(750), ctx.json({ qr: image, code: CODE }));
    }
  )
);

export {};
