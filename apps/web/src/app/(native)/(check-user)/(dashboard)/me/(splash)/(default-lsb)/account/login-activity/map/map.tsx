"use client";

import { clsx } from "clsx";
import { Map as MapImpl, Marker } from "maplibre-gl";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Link from "~/components/link";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import styles from "./map.module.scss";
import { MapProps } from "./map.props";

const Map = (props: MapProps): React.ReactElement => {
  const { ratio, lat, lng, hide_copyright } = props;
  const map_ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    new Marker({
      element: document.createElement("span"),
      className: clsx(styles.x, styles.marker)
    })
      .setLngLat({ lat, lng })
      .addTo(
        new MapImpl({
          // eslint-disable-next-line prefer-snakecase/prefer-snakecase
          attributionControl: false,
          container: map_ref.current!,
          style: {
            version: 8,
            sources: {
              osm: {
                type: "raster",
                tiles: ["https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"],
                // eslint-disable-next-line prefer-snakecase/prefer-snakecase
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
    <AspectRatio className={css["full-w"]} ratio={ratio}>
      <div className={styles.map} ref={map_ref} />
      {!hide_copyright && (
        <Typography
          as={"div"}
          className={clsx(css["t-medium"], styles.x, styles.copyright)}
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
