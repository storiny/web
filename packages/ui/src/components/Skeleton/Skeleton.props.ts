import { PolymorphicProps } from "~/types/index";

export type SkeletonShape = "rectangular" | "circular";

export interface SkeletonProps extends PolymorphicProps<"span"> {
  /**
   * The height of the component in pixels.
   */
  height?: number;
  /**
   * The component shape.
   * @default 'rectangular'
   */
  shape?: SkeletonShape;
  /**
   * The width of the component in pixels.
   */
  width?: number;
}
