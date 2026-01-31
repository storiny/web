// Server static files from .public folder

const { worker, rest } = window.msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_CDN_URL}/uploads/:width/:media_key`,
    (req, res, ctx) => {
      const { media_key } = req.params;
      return res(
        ctx.status(301),
        ctx.set(
          "Location",
          `https://storiny.github.io/web/images/uploads/${media_key}`,
        ),
      );
    },
  ),
);

export {};
