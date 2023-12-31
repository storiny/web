"use client";

import { clsx } from "clsx";
import React from "react";

import { use_app_router } from "~/common/utils";
import Input from "~/components/input";
import SearchIcon from "~/icons/search";

import styles from "./layout.module.scss";

const ErrorLayoutInput = (): React.ReactElement => {
  const router = use_app_router();
  return (
    <Input
      decorator={<SearchIcon />}
      onKeyUp={(event): void => {
        if (event.key === "Enter") {
          router.push(`/explore?query=${event.currentTarget.value || ""}`);
        }
      }}
      placeholder={"Search Storiny"}
      size={"lg"}
      slot_props={{
        container: { className: clsx(styles.x, styles.input) }
      }}
      type={"search"}
    />
  );
};

export default ErrorLayoutInput;
