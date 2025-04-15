/**
 * Merges the new incoming data with the existing cache.
 * @param cache The cache store.
 * @param data The new incoming data.
 * @param compare_fn The comparison function to filter out duplicate entries.
 */
export const merge_fn = <T>(
  cache: { has_more: boolean; items: T[]; page: number },
  data: { has_more: boolean; items: T[]; page: number },
  compare_fn = (old_item: T, new_item: T): boolean =>
    (old_item as any).id === (new_item as any).id
): void => {
  const next_items = data.items.filter(
    (data_item) => !cache.items.some((item) => compare_fn(data_item, item))
  );

  cache.items.push(...next_items);
  cache.has_more = data.has_more;
  cache.page = Math.max(cache.page, data.page);
};
