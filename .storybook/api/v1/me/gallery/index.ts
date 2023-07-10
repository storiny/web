import {
  createClient,
  Photos,
  PhotosWithTotalResults,
  ErrorResponse,
} from "pexels";

const { worker, rest } = (window as any).msw;
const client = createClient(process.env.PEXELS_API_KEY);
const originalFetch = window.fetch;

type ApiResponse = Photos | PhotosWithTotalResults | ErrorResponse;

/**
 * Predicate function for determining an error response
 * @param res Resposne
 */
const isErrorResponse = (res: Photos | ErrorResponse): res is ErrorResponse =>
  "error" in res;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/gallery`,
    async (req, res, ctx) => {
      window.fetch = ctx.fetch;

      const page = req.url.searchParams.get("page");
      const query = req.url.searchParams.get("query");
      let response: ApiResponse;

      if (Boolean(query)) {
        response = await client.photos.search({
          query,
          per_page: 15,
          page: Number.parseInt(page) || 1,
        });
      } else {
        response = await client.photos.curated({
          per_page: 15,
          page: Number.parseInt(page) || 1,
        });
      }

      window.fetch = originalFetch;

      if (isErrorResponse(response)) {
        return res(ctx.status(500));
      }

      return res(ctx.json(response.photos));
    }
  )
);

export {};
