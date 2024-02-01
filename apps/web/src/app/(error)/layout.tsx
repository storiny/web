import { clsx } from "clsx";
import React from "react";

import PlusPattern from "~/brand/plus-pattern";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import Footer from "~/layout/footer";
import css from "~/theme/main.module.scss";

import MinimalLayout from "../(minimal)/layout";
import ErrorLayoutInput from "./input";
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
      className={clsx(css["full-w"], css["full-h"])}
      role={"presentation"}
      style={{ minHeight: "100vh", position: "fixed", pointerEvents: "none" }}
    >
      <PlusPattern />
    </div>
    <div
      className={clsx(css["flex-col"], css["flex-center"], styles.container)}
    >
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
      <div
        className={clsx(css["flex-col"], css["flex-center"], styles.content)}
      >
        <Typography className={css["t-center"]} level={"h2"}>
          {title}
        </Typography>
        <Typography
          className={clsx(
            css["t-center"],
            css["t-minor"],
            styles.x,
            styles.description
          )}
        >
          {description}
        </Typography>
        {enable_search && (
          <>
            <Spacer orientation={"vertical"} size={2} />
            <ErrorLayoutInput />
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
