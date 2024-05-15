"use client";

import { clsx } from "clsx";
import { usePathname as use_pathname } from "next/navigation";
import React from "react";

import { GetBlogArchiveResponse } from "~/common/grpc";
import Link from "~/components/link";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import { get_valid_month, get_valid_year } from "../[year]/[month]";
import styles from "./right-sidebar.module.scss";

interface Props {
  archive: GetBlogArchiveResponse;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

const SuspendedArchiveRightSidebarContent = ({
  archive
}: Props): React.ReactElement => {
  const pathname = use_pathname();
  const [current_year, current_month] = React.useMemo(() => {
    const chunks = (pathname || "").split("/");
    const maybe_month = get_valid_month(chunks[chunks.length - 1]);
    const maybe_year = get_valid_year(chunks[chunks.length - 2]);
    return [maybe_year, maybe_month];
  }, [pathname]);

  return (
    <>
      <Typography as={"span"} color={"minor"} level={"body2"} weight={"bold"}>
        Filter
      </Typography>
      <div
        className={clsx(css["flex-col"], css["flex-center"], styles.timeline)}
      >
        {archive.timeline.length ? (
          archive.timeline.map((item) => (
            <div className={clsx(css["flex-col"], styles.item)} key={item.year}>
              <Typography color={"minor"} level={"body2"} weight={"medium"}>
                {item.year}
              </Typography>
              <div className={clsx(css.flex, styles.months)}>
                {MONTHS.map((month, index) => {
                  const is_available = item.active_months.includes(index + 1);
                  const is_active =
                    current_year === item.year && current_month === index + 1;

                  return (
                    <Link
                      className={clsx(
                        styles.month,
                        is_available && styles.available,
                        is_active && css["t-bold"]
                      )}
                      disabled={!is_available}
                      fixed_color={is_active}
                      href={
                        is_available
                          ? `/archive/${item.year}/${index + 1}`
                          : "#"
                      }
                      key={month}
                      level={"body3"}
                      underline={is_active ? "always" : "hover"}
                    >
                      {month}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div
            className={clsx(css["flex-center"])}
            style={{ minHeight: "150px" }}
          >
            <Typography color={"muted"} level={"body3"}>
              Empty
            </Typography>
          </div>
        )}
      </div>
    </>
  );
};

export default SuspendedArchiveRightSidebarContent;
