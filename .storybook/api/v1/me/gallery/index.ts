import {
  createClient,
  Photos,
  PhotosWithTotalResults,
  ErrorResponse,
} from "pexels";
import { MOCK_ASSETS } from "@storiny/ui/src/mocks";

const { worker, rest } = window.msw;
const client = createClient(process.env.PEXELS_API_KEY || "");
const originalFetch = window.fetch;

type ApiResponse = Photos | PhotosWithTotalResults | ErrorResponse;

/**
 * Predicate function for determining error responses
 * @param res Resposne
 */
const is_error_response = (res: Photos | ErrorResponse): res is ErrorResponse =>
  "error" in res;

worker.use(
  rest.get(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/gallery`,
    async (req, res, ctx) => {
      (window as any).fetch = ctx.fetch;

      const page = req.url.searchParams.get("page") || "";
      const query = req.url.searchParams.get("query") || "";
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

      if (is_error_response(response)) {
        return res(ctx.status(500));
      }

      return res(ctx.json(response.photos));
    },
  ),
);

worker.use(
  rest.post(
    `${process.env.NEXT_PUBLIC_API_URL}/v1/me/gallery`,
    (req, res, ctx) =>
      res(ctx.delay(3400), ctx.status(201), ctx.json(MOCK_ASSETS[1])),
  ),
);

export {};
