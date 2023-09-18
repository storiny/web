import { Binding } from "../../collaboration/bindings";

/**
 * Syncs with transaction
 * @param binding Biding
 * @param fn Transaction function
 */
export const syncWithTransaction = (binding: Binding, fn: () => void): void => {
  binding.doc.transact(fn, binding);
};
