import { PolymorphicProps } from "~/types/index";

export type SpacerOrientation = "vertical" | "horizontal";

export interface SpacerProps extends PolymorphicProps<"span"> {
  /**
   * Whether the component should render inline.
   * @default false
   */
  inline?: boolean;
  /**
   * The orientation of the component.
   * @default 'horizontal'
   */
  orientation?: SpacerOrientation;
  /**
   * The size of the component. Gets multiplied by the spacing factor (8px).
   * @default 1
   */
  size?: number;
}
