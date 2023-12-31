import { PolymorphicProps } from "~/types/index";

export type IconButtonColor = "inverted" | "ruby";
export type IconButtonSize = "xs" | "sm" | "md" | "lg";
export type IconButtonVariant = "rigid" | "hollow" | "ghost";

export interface IconButtonProps extends PolymorphicProps<"button"> {
  /**
   * Automatically resize the component to `lg` when the viewport width is
   * smaller than or equal to tablet
   * @default false
   */
  auto_size?: boolean;
  /**
   * The authentication flag to redirect the user to the login page if they are logged out.
   * @default false
   */
  check_auth?: boolean;
  /**
   * The color of the component.
   * @default 'inverted'
   */
  color?: IconButtonColor;
  /**
   * The loading flag.
   * @default false
   */
  loading?: boolean;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: IconButtonSize;

  /**
   * The component variant.
   * @default 'rigid'
   */
  variant?: IconButtonVariant;
}
