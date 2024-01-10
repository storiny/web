import { curveStep as curve_step } from "@visx/curve";
import { LinearGradient } from "@visx/gradient";
import city_temperature, {
  CityTemperature
} from "@visx/mock-data/lib/mocks/cityTemperature";
import { AnimationTrajectory } from "@visx/react-spring/lib/types";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import {
  AnimatedAreaSeries,
  AnimatedAreaStack,
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

import styles from "./area-chart.module.scss";
import { AreaChartProps } from "./area-chart.props";

const date_scale_config = { type: "band", padding_inner: 0.3 } as const;
const temperature_scale_config = { type: "linear" } as const;
const num_ticks = 6;
const data = city_temperature.slice(40, 275);

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

const getDate = (d: CityTemperature): string => d.date;
const get_sf_temperature = (d: CityTemperature): number =>
  Number(d["San Francisco"]);
const get_ny_temperature = (d: CityTemperature): number =>
  Number(d["New York"]);
const get_austin_temperature = (d: CityTemperature): number => Number(d.Austin);

type Accessor = (d: CityTemperature) => number | string;

interface Accessors {
  Austin: Accessor;
  "New York": Accessor;
  "San Francisco": Accessor;
}

type DataKey = keyof Accessors;

type SimpleScaleConfig = { padding_inner?: number; type: "band" | "linear" };

type ProvidedProps = {
  accessors: {
    date: Accessor;
    x: Accessors;
    y: Accessors;
  };
  animation_trajectory?: AnimationTrajectory;
  annotation_data_key: DataKey | null;
  annotation_datum?: CityTemperature;
  annotation_label_position: { dx: number; dy: number };
  annotation_type?: "line" | "circle";
  color_accessor_factory: (
    key: DataKey
  ) => (d: CityTemperature) => string | null;
  config: {
    x: SimpleScaleConfig;
    y: SimpleScaleConfig;
  };
  curve: typeof curve_step;
  data: CityTemperature[];
  edit_annotation_label_position: boolean;
  enable_tooltip_glyph: boolean;
  num_ticks: number;
};

type ControlsProps = {
  children: (props: ProvidedProps) => React.ReactNode;
};

const Chart = ({ children }: ControlsProps): React.ReactNode => {
  const accessors = React.useMemo(
    () => ({
      x: {
        "San Francisco": getDate,
        "New York": getDate,
        Austin: getDate
      },
      y: {
        "San Francisco": get_sf_temperature,
        "New York": get_ny_temperature,
        Austin: get_austin_temperature
      },
      date: getDate
    }),
    []
  );

  const config = React.useMemo(
    () => ({
      x: date_scale_config,
      y: temperature_scale_config
    }),
    []
  );

  return (
    <>
      {children({
        accessors,
        config,
        curve: curve_step,
        data,
        num_ticks
      })}
    </>
  );
};

export type XYChartProps = {
  height: number;
  width: number;
};

type City = "San Francisco" | "New York" | "Austin";

const Example = ({ height }: XYChartProps): React.ReactNode => {
  const grad_1 = React.useId();
  const grad_2 = React.useId();
  const theme = use_app_selector(select_theme);

  return (
    <Chart>
      {({ accessors, config, curve, data, num_ticks }): React.ReactNode => (
        <XYChart
          height={Math.min(600, height)}
          theme={chart_theme}
          xScale={config.x}
          yScale={config.y}
        >
          <LinearGradient
            from={
              theme === "light"
                ? "rgba(75, 81, 88, 0.20)"
                : "rgba(255, 255, 255, 0.20)"
            }
            id={grad_1}
            stroke={"red"}
            to="transparent"
          />
          <LinearGradient
            from={
              theme === "light"
                ? "rgba(255, 213, 0, 0.35)"
                : "rgba(255, 231, 112, 0.25)"
            }
            id={grad_2}
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
            columns={false}
            numTicks={num_ticks}
            rows
          />
          <AnimatedAreaStack curve={curve} order={"reverse"}>
            <AnimatedAreaSeries
              data={data}
              dataKey="San Francisco"
              fill={`url(#${grad_1})`}
              lineProps={{
                stroke: "var(--inverted-400)",
                strokeWidth: 1
              }}
              renderLine
              xAccessor={accessors.x["San Francisco"]}
              yAccessor={accessors.y["San Francisco"]}
            />
            <AnimatedAreaSeries
              data={data}
              dataKey="New York"
              fill={`url(#${grad_2})`}
              lineProps={{
                stroke: "var(--lemon-400)",
                strokeWidth: 1
              }}
              renderLine
              xAccessor={accessors.x["New York"]}
              yAccessor={accessors.y["New York"]}
            />
          </AnimatedAreaStack>
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
          <Tooltip<CityTemperature>
            className={styles.tooltip}
            renderTooltip={({
              tooltipData: tooltip_data,
              colorScale: color_scale
            }): React.ReactNode => (
              <>
                {/** date */}
                {(tooltip_data?.nearestDatum?.datum &&
                  accessors.date(tooltip_data?.nearestDatum?.datum)) ||
                  "No date"}
                <br />
                <br />
                {/** temperatures */}
                {(
                  Object.keys(tooltip_data?.datumByKey ?? {}).filter(
                    (city) => city
                  ) as City[]
                ).map((city) => {
                  const temperature =
                    tooltip_data?.nearestDatum?.datum &&
                    accessors.y[city](tooltip_data?.nearestDatum?.datum);

                  return (
                    <div key={city}>
                      <em
                        style={{
                          color: color_scale?.(city),
                          textDecoration:
                            tooltip_data?.nearestDatum?.key === city
                              ? "underline"
                              : undefined
                        }}
                      >
                        {city}
                      </em>{" "}
                      {temperature == null || Number.isNaN(temperature)
                        ? "–"
                        : `${temperature}° F`}
                    </div>
                  );
                })}
              </>
            )}
            showHorizontalCrosshair={false}
            showVerticalCrosshair={true}
            snapTooltipToDatumX={false}
            snapTooltipToDatumY={false}
            style={{}}
          />
        </XYChart>
      )}
    </Chart>
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
