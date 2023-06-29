import { PolymorphicProps } from "~/types/index";

export type SheetVariant = "plain" | "outlined" | "elevated";

export interface SheetProps extends PolymorphicProps<"div"> {
  /**
   * The component variant.
   * @default 'outlined'
   */
  variant?: SheetVariant;
}
