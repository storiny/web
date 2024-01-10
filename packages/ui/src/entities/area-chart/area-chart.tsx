import { curveStep as curve_step } from "@visx/curve";
import { LinearGradient } from "@visx/gradient";
import apple_stock, { AppleStock } from "@visx/mock-data/lib/mocks/appleStock";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import {
  scaleLinear as scale_linear,
  scaleTime as scale_time
} from "@visx/scale";
import { extent, max } from "@visx/vendor/d3-array";
import {
  AnimatedAreaSeries,
  AnimatedAxis,
  AnimatedGrid,
  buildChartTheme as build_chart_theme,
  Tooltip,
  XYChart
} from "@visx/xychart";
import clsx from "clsx";
import React from "react";

import { select_theme } from "~/redux/features";
import { use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "~/utils/abbreviate-number";

import styles from "./area-chart.module.scss";
import { AreaChartProps } from "./area-chart.props";

const num_ticks = 8;
const data = apple_stock.slice(0, 90);

const chart_theme = build_chart_theme({
  /* eslint-disable prefer-snakecase/prefer-snakecase */
  backgroundColor: "var(--bg-elevation-sm)",
  colors: ["var(--inverted-400)", "var(--lemon-400)"],
  gridColor: "var(--divider)",
  gridColorDark: "var(--divider)",
  gridStyles: { opacity: 0.85 },
  svgLabelBig: { fill: "var(--fg-minor)" },
  svgLabelSmall: { fill: "var(--fg-minor)" },
  tickLength: 8
  /* eslint-enable prefer-snakecase/prefer-snakecase */
});

const get_date = (d: AppleStock): Date => new Date(d.date);
const get_value = (d: AppleStock): number => d.close;

export type XYChartProps = {
  height: number;
  width: number;
};

const Example = ({ height }: XYChartProps): React.ReactNode => {
  const gradient_id = React.useId();
  const theme = use_app_selector(select_theme);

  const date_scale = React.useMemo(
    () =>
      scale_time({
        range: [0, innerWidth],
        domain: extent(data, get_date) as [Date, Date]
      }),
    []
  );

  const value_scale = React.useMemo(
    () =>
      scale_linear({
        range: [innerHeight, 0],
        domain: [0, (max(data, get_value) || 0) + innerHeight / 3],
        nice: true
      }),
    []
  );

  return (
    <XYChart
      height={Math.min(600, height)}
      theme={chart_theme}
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      xScale={{ type: "band", paddingInner: 0.3 }}
      yScale={{ type: "linear" }}
    >
      <LinearGradient
        from={
          theme === "light"
            ? "rgba(75, 81, 88, 0.20)"
            : "rgba(255, 255, 255, 0.20)"
        }
        id={gradient_id}
        stroke={"red"}
        to="transparent"
      />
      <AnimatedGrid
        animationTrajectory={"center"}
        columns
        numTicks={num_ticks}
        rows={false}
        strokeDasharray={"0 5 0"}
      />
      <AnimatedGrid
        animationTrajectory={"center"}
        className={styles["column-grid"]}
        columns={false}
        numTicks={num_ticks}
        rows
      />
      <AnimatedAreaSeries
        curve={curve_step}
        data={data}
        dataKey=""
        fill={`url(#${gradient_id})`}
        lineProps={{
          stroke: "var(--inverted-400)",
          strokeWidth: 1
        }}
        renderLine
        xAccessor={(x): number => date_scale(get_date(x)) ?? 0}
        yAccessor={(x): number => value_scale(get_value(x)) ?? 0}
      />
      <AnimatedAxis
        animationTrajectory={"center"}
        numTicks={num_ticks}
        orientation={"bottom"}
        stroke={"none"}
      />
      <AnimatedAxis
        animationTrajectory={"center"}
        hideZero
        numTicks={num_ticks}
        orientation={"right"}
        stroke={"none"}
      />
      <Tooltip<AppleStock>
        applyPositionStyle
        className={styles.tooltip}
        glyphStyle={{
          r: 5,
          stroke: "var(--inverted-400)",
          strokeWidth: 2,
          fill: "var(--bg-body)"
        }}
        renderTooltip={({
          tooltipData: tooltip_data,
          colorScale: color_scale
        }): React.ReactNode => (
          <>
            {/** date */}
            {(tooltip_data?.nearestDatum?.datum &&
              date_scale(get_date(tooltip_data?.nearestDatum?.datum))) ||
              "No date"}
            <br />
            <br />
            {/** temperatures */}
            {Object.keys(tooltip_data?.datumByKey ?? {})
              .filter((city) => city)
              .map((city) => {
                const value =
                  tooltip_data?.nearestDatum?.datum &&
                  get_value(tooltip_data?.nearestDatum?.datum);

                return (
                  <div key={city}>
                    <em
                      style={{
                        color: color_scale?.(city)
                      }}
                    >
                      {city}
                    </em>{" "}
                    {value == null || Number.isNaN(value)
                      ? "–"
                      : abbreviate_number(value)}
                  </div>
                );
              })}
          </>
        )}
        showDatumGlyph
        showSeriesGlyphs
        showVerticalCrosshair
        unstyled
        verticalCrosshairStyle={{
          stroke: "var(--inverted-400)",
          strokeWidth: 1
        }}
      />
    </XYChart>
  );
};

const AreaChart = (props: AreaChartProps): React.ReactElement => {
  const { className, ...rest } = props;

  return (
    <div
      {...rest}
      className={clsx(className)}
      style={{ height: "300px", width: "1000px" }}
    >
      <ParentSize>
        {({ width, height }): React.ReactNode => (
          <Example height={height} width={width} />
        )}
      </ParentSize>
    </div>
  );
};

export default AreaChart;
