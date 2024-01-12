"use client";

import { clsx } from "clsx";
import React from "react";

import Divider from "~/components/divider";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import AreaChart from "~/entities/area-chart";
import StatBlock from "~/entities/stat-block";
import css from "~/theme/main.module.scss";

import DashboardTitle from "../../../dashboard-title";
import DashboardWrapper from "../../../dashboard-wrapper";
import styles from "./styles.module.scss";

const AccountMetricsClient = (): React.ReactElement => (
  <React.Fragment>
    <DashboardTitle>Account metrics</DashboardTitle>
    <DashboardWrapper>
      <div className={styles.container}>
        <StatBlock
          caption={"All time"}
          className={styles.stat}
          label={"Total followers"}
          value={648}
        />
        <StatBlock
          caption={"32.4% of your followers"}
          className={styles.stat}
          label={"Subscribers"}
          value={210}
        />
        <StatBlock
          caption={"+10% from last month"}
          caption_icon={"increment"}
          className={styles.stat}
          label={"Follows this month"}
          value={23}
        />
      </div>
      <Divider />
      <div className={css["flex-col"]}>
        <Typography
          as={"h2"}
          className={css["t-medium"]}
          color={"minor"}
          level={"body2"}
        >
          Account follows (last 3 months)
        </Typography>
        <Spacer orientation={"vertical"} size={3} />
        <AreaChart
          accessibility_label={"Account follows chart"}
          data={[
            { value: 100, date: "2022-11-01" },
            { value: 45, date: "2022-11-02" }
          ]}
          label={"Follows"}
        />
      </div>
    </DashboardWrapper>
    <Spacer orientation={"vertical"} size={10} />
  </React.Fragment>
);

export default AccountMetricsClient;
