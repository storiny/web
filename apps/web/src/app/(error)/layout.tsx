import { clsx } from "clsx";
import Image from "next/image";
import React from "react";

import Input from "~/components/input";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import SearchIcon from "~/icons/search";
import Footer from "~/layout/footer";

import MinimalLayout from "../(minimal)/layout";
import styles from "./layout.module.scss";

const ErrorLayout = ({
  children,
  error_code,
  title,
  description,
  enable_search
}: {
  children?: React.ReactNode;
  description?: React.ReactNode;
  enable_search?: boolean;
  error_code: string;
  title: React.ReactNode;
}): React.ReactElement => (
  <MinimalLayout>
    <div
      className={clsx("full-w", "full-h")}
      role={"presentation"}
      style={{ minHeight: "100vh", position: "fixed", pointerEvents: "none" }}
    >
      <Image
        alt={""}
        className={"invert"}
        fill
        loading={"eager"}
        priority
        src={"web-assets/background/noise"}
        style={{ objectFit: "cover", opacity: 0.45 }}
      />
    </div>
    <div className={clsx("flex-col", "flex-center", styles.container)}>
      <Typography
        className={clsx(styles.x, styles["error-code"])}
        level={"display1"}
      >
        {error_code.split("").map((digit, index) => (
          <span className={styles.digit} key={index}>
            {digit}
          </span>
        ))}
      </Typography>
      <div className={clsx("flex-col", "flex-center", styles.content)}>
        <Typography className={"t-center"} level={"h2"}>
          {title}
        </Typography>
        <Typography
          className={clsx("t-center", "t-minor", styles.x, styles.description)}
        >
          {description}
        </Typography>
        {enable_search && (
          <>
            <Spacer orientation={"vertical"} size={2} />
            <Input
              decorator={<SearchIcon />}
              placeholder={"Search Storiny"}
              size={"lg"}
              slot_props={{
                container: { className: clsx(styles.x, styles.input) }
              }}
              type={"search"}
            />
          </>
        )}
      </div>
      {children && (
        <>
          <Spacer orientation={"vertical"} size={5} />
          {children}
        </>
      )}
    </div>
    <Footer />
  </MinimalLayout>
);

export default ErrorLayout;
