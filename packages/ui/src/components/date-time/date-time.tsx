"use client";

import React from "react";

import NoSsr from "~/components/no-ssr";
import { format_date } from "~/utils/format-date";

import { DateTimeProps } from "./date-time.props";

const DateTime = (props: DateTimeProps): React.ReactElement => {
  const { date, format } = props;
  return <NoSsr>{format_date(date, format)}</NoSsr>;
};

export default DateTime;
