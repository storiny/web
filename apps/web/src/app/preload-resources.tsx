"use client";

import React from "react";
import ReactDOM from "react-dom";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export const PreloadResources = (): null => {
  ReactDOM.prefetchDNS(CDN_URL);
  ReactDOM.prefetchDNS(API_URL);
  ReactDOM.preconnect(API_URL);

  // Preload images
  React.useEffect(() => {
    const cache_image = (src: string): Promise<Event> =>
      new Promise<Event>((resolve, reject) => {
        const image = new Image();

        image.src = src;
        image.onload = resolve;
        image.onerror = reject;
      });

    Promise.all([
      cache_image(`${CDN_URL}/web-assets/raw/spritesheets/emoji-sprite`)
    ]).catch(() => undefined);
  }, []);

  return null;
};
