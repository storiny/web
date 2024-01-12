import { clsx } from "clsx";
import React from "react";

import DateTime from "~/components/date-time";
import Link from "~/components/link";
import Skeleton from "~/components/skeleton";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import Persona from "~/entities/persona";
import { get_query_error_type } from "~/redux/features";
import css from "~/theme/main.module.scss";
import { DateFormat } from "~/utils/format-date";

import SuspendedDashboardRightSidebarContent from "../../../(default-rsb)/right-sidebar/content";
import styles from "./right-sidebar.module.scss";
import { AccountMetricsRightSidebarProps } from "./right-sidebar.props";

const UserSkeleton = (): React.ReactElement => (
  <div className={styles.skeleton}>
    <Skeleton height={32} shape={"circular"} width={32} />
    <div className={clsx(css["flex-col"], styles["skeleton-meta"])}>
      <Skeleton height={12} width={128} />
      <Skeleton height={10} width={72} />
    </div>
  </div>
);

const AccountMetricsRightSidebarContent = ({
  hook_return
}: AccountMetricsRightSidebarProps): React.ReactElement => {
  const {
    data,
    isLoading: is_loading,
    isFetching: is_fetching,
    isError: is_error,
    error,
    refetch
  } = hook_return;

  return is_error ? (
    <ErrorState
      component_props={{
        button: { loading: is_fetching }
      }}
      retry={refetch}
      size={"sm"}
      type={get_query_error_type(error)}
    />
  ) : data && !data.recent_followers.length ? (
    <SuspendedDashboardRightSidebarContent />
  ) : (
    <React.Fragment>
      <Typography
        className={clsx(css["t-medium"], css["t-minor"])}
        level={"body2"}
      >
        Recent followers
      </Typography>
      <div className={clsx(css["flex-col"], styles.list)}>
        {!data || is_loading || is_fetching
          ? [...Array(5)].map((_, index) => <UserSkeleton key={index} />)
          : data.recent_followers.map((user) => (
              <Persona
                avatar={{
                  alt: `${user.name}'s avatar`,
                  avatar_id: user.avatar_id,
                  label: user.name,
                  hex: user.avatar_hex
                }}
                component_props={{
                  primary_text: {
                    className: clsx(styles.x, styles["primary-text"])
                  },
                  secondary_text: {
                    className: css["ellipsis"]
                  }
                }}
                key={user.id}
                primary_text={
                  <Link className={css.ellipsis} href={`/${user.username}`}>
                    {user.name}
                  </Link>
                }
                secondary_text={
                  <>
                    <Link className={css.ellipsis} href={`/${user.username}`}>
                      @{user.username}
                    </Link>{" "}
                    &bull;{" "}
                    <DateTime
                      date={user.followed_at}
                      format={DateFormat.RELATIVE}
                    />
                  </>
                }
              />
            ))}
      </div>
    </React.Fragment>
  );
};

export default AccountMetricsRightSidebarContent;
