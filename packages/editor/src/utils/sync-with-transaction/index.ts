import { Binding } from "../../collaboration/bindings";

/**
 * Syncs with transaction
 * @param binding Biding
 * @param fn Transaction function
 */
export const sync_with_transaction = (
  binding: Binding,
  fn: () => void
): void => {
  binding.doc.transact(fn, binding);
};
