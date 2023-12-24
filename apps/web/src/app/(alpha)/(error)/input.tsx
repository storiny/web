"use client";

import { clsx } from "clsx";
import { useRouter as use_router } from "next/navigation";
import React from "react";

import Input from "~/components/input";
import SearchIcon from "~/icons/search";

import styles from "./layout.module.scss";

const ErrorLayoutInput = (): React.ReactElement => {
  const router = use_router();
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
