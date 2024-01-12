import { localPoint as local_point } from "@visx/event";
import { Mercator as MercatorPrimitive } from "@visx/geo";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import {
  useTooltip as use_tooltip,
  useTooltipInPortal as use_tooltip_in_portal
} from "@visx/tooltip";
import clsx from "clsx";
import { isEmojiSupported as is_emoji_supported } from "is-emoji-supported";
import React from "react";
import * as topojson from "topojson-client";

import AspectRatio from "~/components/aspect-ratio";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import styles from "./mercator.module.scss";
import { MercatorProps } from "./mercator.props";
import topology from "./topo-110m.json";

interface FeatureShape {
  geometry: { coordinates: [number, number][][]; type: "Polygon" };
  id: string;
  properties: { code: string; name: string };
  type: "Feature";
}

const world = topojson.feature(
  topology as any,
  topology.objects.countries as any
);

const is_flag_emoji_supported =
  typeof window !== "undefined" && is_emoji_supported("🇦🇶");

/**
 * Converts country code to their flag emoji equivalent
 * @param country_code The country code (alpha-2)
 * @see https://github.com/thekelvinliu/country-code-emoji/tree/main
 */
const get_flag_emoji = (country_code: string): string =>
  country_code.replace(/./g, (char) =>
    String.fromCodePoint(127397 + char.charCodeAt(0))
  );

/**
 * Linearly interpolates the given value to fit within the `target_range` value.
 * @param value The value
 * @param initial_range The initial range
 * @param target_range The target range
 */
const linear_interpolate = (
  value: number,
  initial_range: [number, number],
  target_range: [number, number]
): number =>
  ((value - initial_range[0]) * (target_range[1] - target_range[0])) /
    (initial_range[1] - initial_range[0]) +
  target_range[0];

const Mercator = (props: MercatorProps): React.ReactElement => {
  const { data, style, label, accessibility_label, component_props, ...rest } =
    props;
  const { containerRef: container_ref, TooltipInPortal } =
    use_tooltip_in_portal({
      scroll: true,
      // eslint-disable-next-line prefer-snakecase/prefer-snakecase
      detectBounds: true
    });
  const {
    showTooltip: show_tooltip,
    hideTooltip: hide_tooltip,
    tooltipOpen: tooltip_open,
    tooltipData: tooltip_data,
    tooltipLeft: tooltip_left = 0,
    tooltipTop: tooltip_top = 0
  } = use_tooltip<{ code: string; name: string }>();

  const strength_map = React.useMemo(() => {
    const upper_bound = Math.max(...Object.values(data));
    const map: Record<string, number> = {};

    for (const [code, value] of Object.entries(data)) {
      map[code] = (value / upper_bound) * 100;
    }

    return map;
  }, [data]);

  return (
    <AspectRatio {...rest} ratio={1.5} style={{ ...style, maxWidth: "100%" }}>
      <ParentSize {...component_props?.parent_size}>
        {({ width, height }): React.ReactNode => (
          <div style={{ position: "relative" }}>
            <svg
              aria-label={accessibility_label}
              height={height}
              ref={container_ref}
              width={width}
            >
              <rect fill={"none"} height={height} width={width} x={0} y={0} />
              <MercatorPrimitive<FeatureShape>
                data={
                  (
                    world as unknown as {
                      features: FeatureShape[];
                      type: "FeatureCollection";
                    }
                  ).features
                }
                scale={(width / 630) * 100}
                translate={[width / 2, height / 1.42]}
              >
                {(mercator): React.ReactElement[] =>
                  mercator.features.map(({ feature, path }, i) => (
                    <path
                      className={styles.path}
                      d={path || ""}
                      key={`feature-${i}`}
                      onMouseLeave={hide_tooltip}
                      onMouseMove={(event): void => {
                        const coords = local_point(event);

                        show_tooltip({
                          /* eslint-disable prefer-snakecase/prefer-snakecase */
                          tooltipData: {
                            name: feature.properties.name,
                            code: feature.properties.code
                          },
                          tooltipTop: coords?.y,
                          tooltipLeft: coords?.x
                          /* eslint-enable prefer-snakecase/prefer-snakecase */
                        });
                      }}
                      // Move the path to the bottom so that it is drawn last
                      // to avoid stroke overlapping when hovering
                      onMouseOver={(event): void => {
                        (event.target as SVGElement).parentNode?.appendChild(
                          event.target as HTMLElement
                        );
                      }}
                      style={((): React.CSSProperties => {
                        if (feature.properties.code in strength_map) {
                          const strength = linear_interpolate(
                            strength_map[feature.properties.code],
                            [0, 100],
                            [30, 90] // 12% is the global strength
                          );

                          return {
                            "--fill-strength": `${strength.toFixed(2)}%`
                          } as React.CSSProperties;
                        }

                        return {};
                      })()}
                    />
                  ))
                }
              </MercatorPrimitive>
            </svg>
            {tooltip_open && !!tooltip_data && (
              <TooltipInPortal
                applyPositionStyle
                className={styles.tooltip}
                detectBounds
                left={tooltip_left}
                top={tooltip_top}
                unstyled
              >
                <span>
                  {((): string => {
                    const country_code = tooltip_data?.code;

                    if (!country_code) {
                      return "No data";
                    }

                    return `${
                      is_flag_emoji_supported
                        ? get_flag_emoji(country_code) + " "
                        : ""
                    }${tooltip_data?.name || "No data"}`;
                  })()}
                </span>
                {((): React.ReactElement => {
                  const value = data[tooltip_data?.code || ""] || 0;
                  return (
                    <span>
                      <span className={clsx(css["t-major"], css["t-medium"])}>
                        {abbreviate_number(value)}
                      </span>{" "}
                      {value === 1 ? label.singular : label.plural}
                    </span>
                  );
                })()}
              </TooltipInPortal>
            )}
          </div>
        )}
      </ParentSize>
    </AspectRatio>
  );
};

export default Mercator;
