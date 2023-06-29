// Server static files from .public folder

const { worker, rest } = (window as any).msw;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_CDN_URL}/:width/uploads/:mediaKey`,
    (req, res, ctx) => {
      const { mediaKey } = req.params;
      return res(
        ctx.status(301),
        ctx.set(
          "Location",
          `${process.env.NEXT_PUBLIC_STORYBOOK_URL}/images/uploads/${mediaKey}`
        )
      );
    }
  )
);

export {};
