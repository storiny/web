import { LogoProps } from "src/brand/logo";

import { TypographyProps } from "src/components/typography";
import { PolymorphicProps } from "~/types/index";

export type WordmarkSize = "sm" | "md" | "lg";

export interface WordmarkProps extends PolymorphicProps<"span"> {
  /**
   * The props passed to the individual entity components.
   */
  component_props?: {
    beta_label?: TypographyProps;
    label?: TypographyProps;
    logo?: LogoProps;
  };
  /**
   * Whether to show a beta label.
   * @default false
   */
  show_beta?: boolean;
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: WordmarkSize;
}
