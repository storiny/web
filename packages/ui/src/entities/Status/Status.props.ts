import { PolymorphicProps } from "~/types/index";

export interface StatusProps extends PolymorphicProps<"span"> {
  /**
   * If set to `true`, the status can be modified by the user. It will render a `button`
   * internally, or a `span` otherwise.
   */
  editable?: boolean;
  /**
   * The emoji place before the status text.
   */
  emoji?: string;
  /**
   * The expiration timestamp of the status.
   */
  expiresAt?: string;
  /**
   * The status text.
   */
  text?: string;
}
