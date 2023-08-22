import { ListenerEffectAPI } from "@reduxjs/toolkit";
import { API_VERSION } from "@storiny/shared";

import { AppDispatch, AppState } from "~/redux/store";

/**
 * Sends a request to the server, cancellable using the `listenerApi` signal
 * @param path URL path
 * @param listenerApi Listener API
 * @param init Fetch options
 */
export const fetchApi = async (
  path: string,
  listenerApi: ListenerEffectAPI<AppState, AppDispatch>,
  init?: Parameters<typeof fetch>[1]
): Promise<Response | undefined> =>
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v${API_VERSION}/${path}`, {
    ...init,
    credentials: "include",
    signal: listenerApi.signal
  });
