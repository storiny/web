"use client";

import { clsx } from "clsx";
import Image from "next/image";
import { useRouter as use_router } from "next/navigation";
import React from "react";

import Input from "~/components/input";
import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import SearchIcon from "~/icons/search";
import Footer from "~/layout/footer";
import css from "~/theme/main.module.scss";

import MinimalLayout from "../(minimal)/layout";
import styles from "./layout.module.scss";

const ErrorLayout = ({
  children,
  error_code,
  title,
  description,
  enable_search,
  // TODO: remove hide_footer after alpha
  hide_footer
}: {
  children?: React.ReactNode;
  description?: React.ReactNode;
  enable_search?: boolean;
  error_code: string;
  hide_footer?: boolean;
  title: React.ReactNode;
}): React.ReactElement => {
  const router = use_router();
  return (
    <MinimalLayout>
      <div
        className={clsx(css["full-w"], css["full-h"])}
        role={"presentation"}
        style={{ minHeight: "100vh", position: "fixed", pointerEvents: "none" }}
      >
        <Image
          alt={""}
          data-invert-filter={""}
          fill
          loading={"eager"}
          priority
          src={"web-assets/background/noise"}
          style={{ objectFit: "cover", opacity: 0.45 }}
        />
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
              <Input
                decorator={<SearchIcon />}
                onKeyUp={(event): void => {
                  if (event.key === "Enter") {
                    router.push(
                      `/explore?query=${event.currentTarget.value || ""}`
                    );
                  }
                }}
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
      {!hide_footer && <Footer />}
    </MinimalLayout>
  );
};

export default ErrorLayout;
