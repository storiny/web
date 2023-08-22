"use client";

import { copyToClipboard } from "~/utils/copyToClipboard";

/**
 * Triggers the web share APi
 * @param text The text label for the URL
 * @param url The URL to share
 */
export const webShare = async ({
  text,
  url
}: {
  text: string;
  url: string | null;
}): Promise<void> => {
  const data = {
    text,
    title: "Storiny",
    url: url || undefined
  };

  if (navigator.share) {
    await navigator.share(data);
  } else {
    await copyToClipboard(url || text);
  }
};
