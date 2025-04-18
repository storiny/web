import { use_app_selector } from "~/redux/hooks";
import { AppState } from "~/redux/store";

/**
 * Returns the latest cached page number for the endpoint data.
 * @param select The cache selector function for the endpoint.
 */
export const use_pagination = (
  select: (state: AppState) => { data?: { page?: number } }
): number => {
  const cache = use_app_selector((state) => select(state));
  return cache?.data?.page ?? 1;
};
