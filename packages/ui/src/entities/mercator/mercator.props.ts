import { ParentSizeProps } from "@visx/responsive/lib/components/ParentSize";

import { AspectRatioProps } from "~/components/aspect-ratio";

/**
 * The data for mercator, an array of tuples of country codes with their
 * corresponding values.
 */
export type MercatorData = [country_code: string, value: number][];

export type MercatorProps = AspectRatioProps & {
  /**
   * The `aria-label` for the chart SVG
   */
  accessibility_label: string;
  /**
   * The props passed to the individual entity components
   */
  component_props?: {
    parent_size: Omit<ParentSizeProps, "children">;
  };
  /**
   * Data for the chart
   */
  data: MercatorData;
  /**
   * The label for the tooltip
   */
  label: {
    plural: string;
    singular: string;
  };
};
