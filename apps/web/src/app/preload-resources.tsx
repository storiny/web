"use client";

import ReactDOM from "react-dom";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const PreloadResources = (): null => {
  ReactDOM.preconnect(CDN_URL);
  ReactDOM.prefetchDNS(CDN_URL);

  ReactDOM.preconnect(API_URL);
  ReactDOM.prefetchDNS(API_URL);

  return null;
};
