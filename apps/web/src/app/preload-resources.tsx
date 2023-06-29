"use client";

import ReactDOM from "react-dom";

const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL;
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// TODO: Remove @ts-ignore once React includes the missing type definitions
export const PreloadResources = (): null => {
  // @ts-ignore
  ReactDOM.preconnect(cdnUrl);
  // @ts-ignore
  ReactDOM.preconnect(apiUrl);
  // @ts-ignore
  ReactDOM.prefetchDNS(cdnUrl);
  // @ts-ignore
  ReactDOM.prefetchDNS(apiUrl);

  return null;
};
