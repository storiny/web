import { use_modal } from "../../../../ui/src/components/modal";

export interface EmbedModalProps {
  modal?: boolean;
  trigger: Parameters<typeof use_modal>[0];
}
