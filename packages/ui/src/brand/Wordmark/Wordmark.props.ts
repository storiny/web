import { LogoProps } from "~/brand/Logo";
import { TypographyProps } from "~/components/Typography";
import { PolymorphicProps } from "~/types/index";

export type WordmarkSize = "sm" | "md" | "lg";

export interface WordmarkProps extends PolymorphicProps<"span"> {
  /**
   * The props passed to the individual entity components.
   */
  componentProps?: {
    betaLabel?: TypographyProps;
    label?: TypographyProps;
    logo?: LogoProps;
  };
  /**
   * Whether to show a beta label.
   * @default false
   */
  showBeta?: boolean;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: WordmarkSize;
}
