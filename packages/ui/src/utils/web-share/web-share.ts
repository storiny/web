"use client";

import { copy_to_clipboard } from "src/utils/copy-to-clipboard";

/**
 * Triggers the web share APi
 * @param text Text label for the URL
 * @param url URL to share
 */
export const web_share = async ({
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
    await copy_to_clipboard(url || text);
  }
};
