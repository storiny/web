import { DEFAULT_WPM } from "@storiny/shared";

/**
 * Computes the reading time based on the user's reading speed
 * @param word_count Number of words
 * @param wpm User's reading speed
 */
export const get_read_time = (word_count: number, wpm = DEFAULT_WPM): number =>
  Math.floor((word_count || 1) / wpm) || 1;
