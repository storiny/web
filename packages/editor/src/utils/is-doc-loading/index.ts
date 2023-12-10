import { DOC_STATUS, DocStatus } from "../../atoms";

/**
 * Predicate function for determining whether the document is loading based on the document status.
 * @param doc_status The document status.
 */
export const is_doc_loading = (doc_status: DocStatus): boolean =>
  [DOC_STATUS.connecting, DOC_STATUS.reconnecting].includes(doc_status);
