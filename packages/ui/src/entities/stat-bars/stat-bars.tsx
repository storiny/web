import clsx from "clsx";
import React from "react";

import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import styles from "./stat-bars.module.scss";
import { StatBarsData, StatBarsProps } from "./stat-bars.props";

const StatBars = <T extends StatBarsData>(
  props: StatBarsProps<T>
): React.ReactElement => {
  const { data, icon_map, max_value, className, ...rest } = props;
  const strength_map = React.useMemo(() => {
    const map: Record<string, number> = {};

    for (const [label, value] of data) {
      map[label] = Math.round((value / max_value) * 100);
    }

    return map;
  }, [data, max_value]);

  return (
    <div
      {...rest}
      className={clsx(css["flex-col"], styles["stat-bars"], className)}
    >
      {data.map(([label, value]) => (
        <div
          className={clsx(css["flex-center"], styles.bar)}
          key={label}
          style={
            {
              "--strength": `${strength_map[label] || 0}%`
            } as React.CSSProperties
          }
        >
          <Typography className={styles.label} ellipsis level={"body2"}>
            {icon_map ? icon_map[label as keyof typeof icon_map] || null : null}
            {label}
          </Typography>
          <Typography
            className={clsx(css["t-medium"], styles.value)}
            level={"body3"}
          >
            {abbreviate_number(value)}{" "}
            <span className={css["t-minor"]}>
              ({strength_map[label] || 0}%)
            </span>
          </Typography>
        </div>
      ))}
    </div>
  );
};

export default StatBars;
