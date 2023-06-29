import { DEFAULT_WPM } from "@storiny/shared";

/**
 * Computes the reading time based on user's reading speed
 * @param wordCount Number of words
 * @param wpm User's reading speed
 */
export const getReadTime = (wordCount: number, wpm = DEFAULT_WPM): number =>
  Math.floor((wordCount || 1) / wpm) || 1;
