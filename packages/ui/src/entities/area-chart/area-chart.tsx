import { curveStep as curve_step } from "@visx/curve";
import { LinearGradient } from "@visx/gradient";
import { LegendOrdinal } from "@visx/legend";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import { timeFormat as time_format } from "@visx/vendor/d3-time-format";
import {
  AnimatedAreaSeries,
  AnimatedAxis,
  AnimatedGrid,
  buildChartTheme as build_chart_theme,
  DataContext,
  DataProvider,
  Tooltip,
  XYChart
} from "@visx/xychart";
import clsx from "clsx";
import React from "react";

import { select_theme } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import styles from "./area-chart.module.scss";
import { AreaChartDatum, AreaChartProps } from "./area-chart.props";

const DEFAULT_NUM_TICKS = 8;
const MIN_HEIGHT = 300; // px

// eslint-disable-next-line prefer-snakecase/prefer-snakecase
export const DATE_SCALE_CONFIG = { type: "band", paddingInner: 0.3 } as const;
export const VALUE_SCALE_CONFIG = { type: "linear" } as const;

const chart_theme = build_chart_theme({
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  backgroundColor: "var(--bg-body)",
  colors: ["var(--inverted-400)"],
  gridColor: "var(--divider)",
  gridColorDark: "var(--divider)",
  svgLabelBig: { fill: "var(--fg-minor)" },
  svgLabelSmall: { fill: "var(--fg-minor)" },
  tickLength: 6
  /* eslint-enable prefer-snakecase/prefer-snakecase */
});

/**
 * Returns the date part for a given datum
 * @param datum Datum
 */
const get_date = (datum: AreaChartDatum): Date => new Date(datum.date);

/**
 * Returns the value part for a given datum
 * @param datum Datum
 */
const get_value = (datum: AreaChartDatum): number => datum.value;

/**
 * Date formatter
 */
const format_date = time_format("%b %d");

const ChartLegend = (): React.ReactElement | null => {
  const { colorScale: color_scale, margin } = React.useContext(DataContext);

  if (!color_scale) {
    return null;
  }

  return (
    <LegendOrdinal
      direction="row"
      scale={color_scale}
      shape={"circle"}
      shapeHeight={10}
      shapeStyle={(): React.CSSProperties => ({
        stroke: "var(--divider)",
        strokeWidth: 1
      })}
      shapeWidth={10}
      style={{
        marginBottom: -36,
        paddingLeft: margin?.left,
        color: "var(--fg-minor)",
        fontSize: "12px",
        lineHeight: "17px",
        display: "flex"
      }}
    />
  );
};

const AreaChart = (props: AreaChartProps): React.ReactElement => {
  const {
    data,
    num_ticks = DEFAULT_NUM_TICKS,
    style,
    component_props,
    label,
    accessibility_label,
    ...rest
  } = props;
  const gradient_id = React.useId();
  const theme = use_app_selector(select_theme);

  return (
    <ParentSize {...rest} style={{ maxWidth: "100%", ...style }}>
      {({ width, height }): React.ReactNode => (
        <DataProvider
          theme={chart_theme}
          xScale={DATE_SCALE_CONFIG}
          yScale={VALUE_SCALE_CONFIG}
        >
          <ChartLegend />
          <XYChart<
            typeof DATE_SCALE_CONFIG,
            typeof VALUE_SCALE_CONFIG,
            AreaChartDatum
          >
            {...component_props?.xy_chart}
            accessibilityLabel={accessibility_label}
            height={Math.min(MIN_HEIGHT, height)}
            width={width}
          >
            <LinearGradient
              from={
                theme === "light"
                  ? "rgba(75, 81, 88, 0.20)"
                  : "rgba(255, 255, 255, 0.20)"
              }
              to="transparent"
              {...component_props?.gradient}
              id={gradient_id}
            />
            <AnimatedGrid
              animationTrajectory={"center"}
              columns
              numTicks={num_ticks}
              rows={false}
              {...component_props?.grid_y}
              className={clsx(
                styles.grid,
                styles.column,
                component_props?.grid_y?.className
              )}
              strokeDasharray={"5,4"}
            />
            <AnimatedGrid
              animationTrajectory={"center"}
              columns={false}
              numTicks={num_ticks}
              rows
              {...component_props?.grid_x}
              className={clsx(styles.grid, component_props?.grid_x?.className)}
            />
            <AnimatedAreaSeries
              curve={curve_step}
              data={data}
              dataKey={label}
              fill={`url(#${gradient_id})`}
              lineProps={{
                stroke: "var(--inverted-400)",
                strokeWidth: 1
              }}
              renderLine
              xAccessor={(x): string => format_date(get_date(x))}
              yAccessor={(x): number => get_value(x) ?? 0}
            />
            <AnimatedAxis
              animationTrajectory={"center"}
              stroke={"none"}
              {...component_props?.axis_x}
              numTicks={num_ticks}
              orientation={"bottom"}
            />
            <AnimatedAxis
              animationTrajectory={"center"}
              hideZero
              stroke={"none"}
              {...component_props?.axis_y}
              numTicks={num_ticks}
              orientation={"right"}
            />
            <Tooltip<AreaChartDatum>
              applyPositionStyle
              detectBounds
              glyphStyle={{
                r: 5,
                stroke: "var(--inverted-400)",
                strokeWidth: 2,
                fill: "var(--bg-body)"
              }}
              renderTooltip={({
                tooltipData: tooltip_data
              }): React.ReactNode => (
                <>
                  <div
                    className={clsx(
                      css["flex-center"],
                      styles["tooltip-value"]
                    )}
                  >
                    <span className={styles["tooltip-marker"]} />
                    {(tooltip_data?.nearestDatum?.datum &&
                      abbreviate_number(
                        get_value(tooltip_data?.nearestDatum?.datum)
                      )) ||
                      "No data"}
                  </div>
                  {(tooltip_data?.nearestDatum?.datum &&
                    format_date(get_date(tooltip_data?.nearestDatum?.datum))) ||
                    null}
                </>
              )}
              showDatumGlyph
              showVerticalCrosshair
              snapTooltipToDatumX
              snapTooltipToDatumY
              unstyled
              verticalCrosshairStyle={{
                stroke: "var(--inverted-400)",
                strokeWidth: 1
              }}
              {...component_props?.tooltip}
              className={clsx(
                css["flex-col"],
                css["flex-center"],
                styles.tooltip,
                component_props?.tooltip?.className
              )}
            />
          </XYChart>
        </DataProvider>
      )}
    </ParentSize>
  );
};

export default AreaChart;
