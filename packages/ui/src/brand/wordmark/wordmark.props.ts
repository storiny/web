import { LogoProps } from "~/brand/logo";
import { TypographyProps } from "~/components/typography";
import { PolymorphicProps } from "~/types/index";

export type WordmarkSize = "sm" | "md" | "lg";

export interface WordmarkProps extends PolymorphicProps<"span"> {
  /**
   * The props passed to the individual entity components.
   */
  component_props?: {
    label?: TypographyProps;
    logo?: LogoProps;
  };
  /**
   * The size of the component.
   * @default 'md'
   */
  size?: WordmarkSize;
}
