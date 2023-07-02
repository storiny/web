"use client";

import { StoryCategory } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Input from "~/components/Input";
import SearchIcon from "~/icons/Search";

import styles from "./styles.module.scss";

interface Props {
  category: StoryCategory | "all";
}

const Client = (props: Props): React.ReactElement => (
  <>
    <div className={clsx("flex-col", styles.x, styles["splash-container"])}>
      {props.category}
      <Input
        decorator={<SearchIcon />}
        placeholder={"Search Storiny"}
        size={"lg"}
        slotProps={{
          container: {
            className: clsx(styles.x, styles.input)
          }
        }}
      />
    </div>
  </>
);

export default Client;
