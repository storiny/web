import { clsx } from "clsx";
import { DynamicOptionsLoadingProps } from "next/dynamic";
import React from "react";

import Button from "~/components/button";
import Skeleton from "~/components/skeleton";
import Spacer from "~/components/spacer";
import Spinner from "~/components/spinner";
import Typography from "~/components/typography";
import RetryIcon from "~/icons/retry";
import css from "~/theme/main.module.scss";

import editor_styles from "../../editor.module.scss";
import styles from "./skeleton.module.scss";

const CodeBlockSkeleton = ({
  retry,
  error,
  isLoading: is_loading
}: DynamicOptionsLoadingProps): React.ReactElement => (
  <div aria-busy={"true"} className={editor_styles["code-block"]}>
    <div
      className={clsx(
        editor_styles.container,
        css["grid"],
        css["dashboard"],
        css["no-sidenav"]
      )}
    >
      <div
        className={clsx(css["flex-col"], editor_styles.content)}
        style={{
          height: "338px",
          cursor: error && !is_loading ? "default" : "progress",
          textAlign: "center"
        }}
      >
        <div className={clsx(css["flex-center"], editor_styles.header)}>
          <div className={clsx(css.flex, editor_styles.info)}>
            <span className={css["flex-center"]}>
              <Skeleton height={18} width={18} />
            </span>
            <Spacer />
            <Skeleton height={14} width={128} />
          </div>
          <div className={clsx(css["flex-center"], editor_styles.actions)}>
            <div className={clsx(css["flex-center"], styles.action)}>
              <Skeleton height={18} width={18} />
            </div>
            <div className={clsx(css["flex-center"], styles.action)}>
              <Skeleton height={18} width={18} />
            </div>
          </div>
        </div>
        <div
          className={clsx(
            css["full-w"],
            css["full-h"],
            css["flex-col"],
            css["flex-center"]
          )}
        >
          {error && !is_loading ? (
            <>
              <Typography color={"minor"} level={"body2"}>
                Unable to load the code block
              </Typography>
              <Spacer orientation={"vertical"} size={2} />
              <Button
                decorator={<RetryIcon />}
                onClick={(): void => {
                  retry?.();
                }}
                size={"sm"}
              >
                Retry
              </Button>
            </>
          ) : (
            <Spinner />
          )}
        </div>
      </div>
    </div>
    {/* Compensate for the absolute position of the skeleton element */}
    <div
      aria-hidden
      style={{
        height: "338px"
      }}
    />
  </div>
);

export default CodeBlockSkeleton;
