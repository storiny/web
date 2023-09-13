import { useModal } from "~/components/Modal";

export interface EmbedModalProps {
  modal?: boolean;
  trigger: Parameters<typeof useModal>[0];
}
