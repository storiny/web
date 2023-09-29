"use client";

import { clsx } from "clsx";
import { Map as MapImpl, Marker } from "maplibre-gl";
import React from "react";

import AspectRatio from "../../../../../../../../../../../../packages/ui/src/components/aspect-ratio";
import Link from "../../../../../../../../../../../../packages/ui/src/components/link";
import Typography from "../../../../../../../../../../../../packages/ui/src/components/typography";

import styles from "./map.module.scss";
import { MapProps } from "./map.props";

const Map = (props: MapProps): React.ReactElement => {
  const { ratio, lat, lng, hideCopyright } = props;
  const mapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    new Marker({
      element: document.createElement("span"),
      className: clsx(styles.x, styles.marker)
    })
      .setLngLat({ lat, lng })
      .addTo(
        new MapImpl({
          attributionControl: false,
          container: mapRef.current!,
          style: {
            version: 8,
            sources: {
              osm: {
                type: "raster",
                tiles: ["https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"],
                tileSize: 256
              }
            },
            layers: [
              {
                id: "osm",
                type: "raster",
                source: "osm"
              }
            ]
          },
          center: { lat, lng },
          zoom: 11,
          interactive: false
        })
      );
  }, [lat, lng]);

  return (
    <AspectRatio className={"full-w"} ratio={ratio}>
      <div className={clsx(styles.x, styles.map)} ref={mapRef} />
      {!hideCopyright && (
        <Typography
          as={"div"}
          className={clsx("t-medium", styles.x, styles.copyright)}
        >
          ©{" "}
          <Link
            fixed_color
            href={"https://www.openstreetmap.org/copyright"}
            target={"_blank"}
          >
            OpenStreetMap contributors
          </Link>
          <br />
          Map by{" "}
          <Link
            fixed_color
            href={"http://www.openstreetmap.fr/mentions-legales/"}
            target={"_blank"}
          >
            OpenStreetMap France
          </Link>
        </Typography>
      )}
    </AspectRatio>
  );
};

export default Map;
