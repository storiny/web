import { useModal } from "~/components/Modal";

export interface EmbedModalProps {
  trigger: Parameters<typeof useModal>[0];
}
