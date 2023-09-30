"use client";

import ReactDOM from "react-dom";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

// TODO: Remove @ts-expect-error once React includes the missing type definitions
export const PreloadResources = (): null => {
  // @ts-expect-error missing defs
  ReactDOM.preconnect(CDN_URL);
  // @ts-expect-error missing defs
  ReactDOM.preconnect(API_URL);
  // @ts-expect-error missing defs
  ReactDOM.prefetchDNS(CDN_URL);
  // @ts-expect-error missing defs
  ReactDOM.prefetchDNS(API_URL);

  return null;
};
