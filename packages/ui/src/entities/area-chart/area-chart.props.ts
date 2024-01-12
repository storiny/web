import { LinearGradientProps } from "@visx/gradient/lib/gradients/LinearGradient";
import { ParentSizeProps } from "@visx/responsive/lib/components/ParentSize";
import { AnimatedAxisProps } from "@visx/xychart/lib/components/axis/AnimatedAxis";
import { AnimatedGridProps } from "@visx/xychart/lib/components/grid/AnimatedGrid";
import { TooltipProps } from "@visx/xychart/lib/components/Tooltip";
import { XYChartProps } from "@visx/xychart/lib/components/XYChart";

import { AspectRatioProps } from "~/components/aspect-ratio";

import { DATE_SCALE_CONFIG, VALUE_SCALE_CONFIG } from "./area-chart";

export interface AreaChartDatum {
  /**
   * The date part (for x-axis)
   */
  date: string;
  /**
   * The value part (for y-axis)
   */
  value: number;
}

export type AreaChartData = AreaChartDatum[];

export type AreaChartProps = AspectRatioProps & {
  /**
   * The `aria-label` for the chart SVG
   */
  accessibility_label: string;
  /**
   * The props passed to the individual entity components
   */
  component_props?: {
    axis_x?: AnimatedAxisProps<any>;
    axis_y?: AnimatedAxisProps<any>;
    gradient?: LinearGradientProps;
    grid_x?: AnimatedGridProps;
    grid_y?: AnimatedGridProps;
    parent_size: Omit<ParentSizeProps, "children">;
    tooltip?: TooltipProps<AreaChartDatum>;
    xy_chart?: XYChartProps<
      typeof DATE_SCALE_CONFIG,
      typeof VALUE_SCALE_CONFIG,
      AreaChartDatum
    >;
  };
  /**
   * Data for the chart
   */
  data: AreaChartData;
  /**
   * The label for the chart
   */
  label: string;
  /**
   * Override the number of ticks
   */
  num_ticks?: number;
};
