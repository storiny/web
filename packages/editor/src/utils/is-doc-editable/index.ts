import { DOC_STATUS, DocStatus } from "../../atoms";

/**
 * Predicate function for determining whether the document is editable based on the document status.
 * @param doc_status The document status.
 */
export const is_doc_editable = (doc_status: DocStatus): boolean =>
  [
    DOC_STATUS.connecting,
    DOC_STATUS.connected,
    DOC_STATUS.reconnecting,
    DOC_STATUS.syncing,
    DOC_STATUS.synced,
    DOC_STATUS.publishing
  ].includes(doc_status);
