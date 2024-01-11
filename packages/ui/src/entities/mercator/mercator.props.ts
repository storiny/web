import { ParentSizeProps } from "@visx/responsive/lib/components/ParentSize";

import { AspectRatioProps } from "~/components/aspect-ratio";

export interface MercatorDatum {
  /**
   * The country code in ISO 3166-1 alpha-2 format
   */
  code: string;
  /**
   * The value for the country code
   */
  value: number;
}

export type MercatorData = MercatorDatum[];

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
};
