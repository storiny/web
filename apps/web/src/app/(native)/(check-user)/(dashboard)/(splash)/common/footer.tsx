"use client";

import React from "react";

import Footer from "~/layout/footer";
import css from "~/theme/main.module.scss";

const DashboardFooter = (): React.ReactElement | null => <Footer className={css["below-desktop"]} style={{ marginTop: "160px" }} />;

export default DashboardFooter;
