import { use_modal } from "~/components/modal";

export type ReportEntityType = "story" | "user" | "tag" | "comment" | "reply";

export interface ReportModalProps {
  /**
   * ID of the entity being reported.
   */
  entity_id: string;
  /**
   * Type of the entity being reported.
   */
  entity_type: ReportEntityType;
  /**
   * Initial open state of the modal.
   */
  open?: boolean;
  /**
   * Modal trigger component
   */
  trigger: Parameters<typeof use_modal>[0];
}
