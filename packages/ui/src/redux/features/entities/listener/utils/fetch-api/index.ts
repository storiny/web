import { ListenerEffectAPI } from "@reduxjs/toolkit";
import { API_VERSION } from "@storiny/shared";

import { get_api_server_url } from "~/redux/features/api/slice";
import { AppDispatch, AppState } from "~/redux/store";

/**
 * Sends a request to the server, cancellable using the `listener_api` signal
 * @param path URL path
 * @param listener_api Listener API
 * @param init Fetch options
 */
export const fetch_api = async (
  path: string,
  listener_api: ListenerEffectAPI<AppState, AppDispatch>,
  init?: Parameters<typeof fetch>[1]
): Promise<Response | undefined> =>
  await fetch(`${get_api_server_url()}/v${API_VERSION}/${path}`, {
    ...init,
    credentials: "include",
    signal: listener_api.signal
  });
