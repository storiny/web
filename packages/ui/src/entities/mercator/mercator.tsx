import { Graticule, Mercator as MercatorPrimitive } from "@visx/geo";
import ParentSize from "@visx/responsive/lib/components/ParentSize";
import { scaleQuantize as scale_quantize } from "@visx/scale";
import React from "react";
import topojson from "topojson-client";

import { MercatorProps } from "./mercator.props";
import topology from "./topo-110m.json";

export const background = "#f9f7e8";

export type GeoMercatorProps = {
  events?: boolean;
  height: number;
  width: number;
};

interface FeatureShape {
  geometry: { coordinates: [number, number][][]; type: "Polygon" };
  id: string;
  properties: { name: string };
  type: "Feature";
}

// @ts-expect-error ---
const world = topojson.feature(topology, topology.objects.units) as {
  features: FeatureShape[];
  type: "FeatureCollection";
};

const color = scale_quantize({
  domain: [
    Math.min(...world.features.map((f) => f.geometry.coordinates.length)),
    Math.max(...world.features.map((f) => f.geometry.coordinates.length))
  ],
  range: [
    "#ffb01d",
    "#ffa020",
    "#ff9221",
    "#ff8424",
    "#ff7425",
    "#fc5e2f",
    "#f94b3a",
    "#f63a48"
  ]
});

const Mercator = (props: MercatorProps): React.ReactElement => {
  const { style, label, accessibility_label, ...rest } = props;

  return (
    <ParentSize {...rest} style={{ maxWidth: "100%", ...style }}>
      {({ width, height }): React.ReactNode => (
        <svg height={height} width={width}>
          <rect
            fill={background}
            height={height}
            rx={14}
            width={width}
            x={0}
            y={0}
          />
          <MercatorPrimitive<FeatureShape>
            data={world.features}
            scale={(width / 630) * 100}
            translate={[width / 2, height / 2 + 50]}
          >
            {(mercator) => (
              <g>
                <Graticule
                  graticule={(g) => mercator.path(g) || ""}
                  stroke="rgba(33,33,33,0.05)"
                />
                {mercator.features.map(({ feature, path }, i) => (
                  <path
                    d={path || ""}
                    fill={color(feature.geometry.coordinates.length)}
                    key={`map-feature-${i}`}
                    stroke={background}
                    strokeWidth={0.5}
                  />
                ))}
              </g>
            )}
          </MercatorPrimitive>
        </svg>
      )}
    </ParentSize>
  );
};

export default Mercator;
