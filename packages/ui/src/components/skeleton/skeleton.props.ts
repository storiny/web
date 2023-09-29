import { PolymorphicProps } from "~/types/index";

export type SkeletonShape = "rectangular" | "circular";

export interface SkeletonProps extends PolymorphicProps<"span"> {
  /**
   * The height of the component in pixels.
   */
  height?: number;
  /**
   * If `true`, does not apply border radius to the rectangular shape.
   * @default false
   */
  no_radius?: boolean;
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
