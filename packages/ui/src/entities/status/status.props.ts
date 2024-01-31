import { ModalProps } from "~/components/modal";
import { PolymorphicProps } from "~/types/index";

export interface StatusProps extends PolymorphicProps<"span"> {
  /**
   * Skips rendering modal for tests
   */
  disable_modal?: boolean;
  /**
   * The editable flag. If `true`, the status can be modified if it belongs to the user.
   * @default true
   */
  editable?: boolean;
  /**
   * The emoji place before the status text.
   */
  emoji?: string | null;
  /**
   * The expiration timestamp of the status.
   */
  expires_at?: string | null;
  /**
   * Props passed to the `Modal` component.
   */
  modal_props?: ModalProps;
  /**
   * The status text.
   */
  text?: string | null;
  /**
   * The ID of the user.
   */
  user_id: string;
}
