import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Avatar from "~/components/avatar";
import Image from "~/components/image";
import Link from "~/components/link";
import Skeleton from "~/components/skeleton";
import Typography from "~/components/typography";
import ErrorState from "~/entities/error-state";
import Status from "~/entities/status";
import PhotoPlusIcon from "~/icons/photo-plus";
import { fetch_user } from "~/redux/features";
import {
  select_auth_status,
  select_user
} from "~/redux/features/auth/selectors";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import css from "~/theme/main.module.scss";
import { abbreviate_number } from "~/utils/abbreviate-number";

import styles from "./persona.module.scss";

const LeftSidebarPersona = (): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const auth_state = use_app_selector(select_auth_status);
  const user = use_app_selector(select_user);
  const loading = ["loading", "idle"].includes(auth_state);

  if (auth_state === "error") {
    return (
      <ErrorState
        component_props={{
          button: { loading }
        }}
        retry={(): void => {
          dispatch(fetch_user());
        }}
        size={"sm"}
      />
    );
  }

  return (
    <>
      <AspectRatio
        className={clsx(styles.banner, user?.banner_id && styles["has-banner"])}
        ratio={66 / 25}
      >
        {loading ? (
          <Skeleton no_radius />
        ) : user?.banner_id ? (
          <Image
            alt={""}
            data-testid={"lsb-banner"}
            hex={user.banner_hex}
            img_key={user.banner_id}
            size={320}
          />
        ) : (
          <NextLink
            className={clsx(css["flex-center"], styles["banner-placeholder"])}
            href={"/me/account/profile"}
          >
            <PhotoPlusIcon />
          </NextLink>
        )}
      </AspectRatio>
      {loading ? (
        <Skeleton
          className={styles.avatar}
          height={64}
          shape={"circular"}
          width={64}
        />
      ) : (
        <Avatar
          alt={""}
          avatar_id={user?.avatar_id}
          borderless
          className={styles.avatar}
          hex={user?.avatar_hex}
          label={user?.name}
          size={"xl"}
        />
      )}
      <div className={clsx(css["flex-center"], styles.meta)}>
        {loading ? (
          <>
            <span className={css["flex-col"]} style={{ gap: "8px" }}>
              <Skeleton height={16} width={72} />
              <Skeleton height={14} width={96} />
            </span>
            <span
              className={css["flex-col"]}
              style={{ gap: "8px", alignItems: "center" }}
            >
              <Skeleton height={16} width={72} />
              <Skeleton height={14} width={96} />
            </span>
          </>
        ) : (
          <>
            <div className={css["flex-col"]}>
              <Link
                className={css["t-bold"]}
                ellipsis
                fixed_color
                href={`/${user?.username || "profile"}`}
                level={"body1"}
              >
                {user?.name}
              </Link>
              <Link
                className={clsx(css["t-minor"], css["t-medium"])}
                ellipsis
                href={`/${user?.username || "profile"}`}
                level={"body2"}
              >
                @{user?.username}
              </Link>
            </div>
            <Typography
              className={clsx(css["flex-col"], styles["follower-count"])}
            >
              {abbreviate_number(user?.follower_count || 0)}
              <Typography className={css["t-minor"]} level={"body2"}>
                {user?.follower_count === 1 ? "follower" : "followers"}
              </Typography>
            </Typography>
          </>
        )}
      </div>
      {loading ? (
        <Skeleton height={30} style={{ marginTop: "4px" }} />
      ) : (
        <Status
          emoji={user?.status?.emoji}
          expires_at={user?.status?.expires_at}
          text={user?.status?.text}
          user_id={user?.id || ""}
        />
      )}
    </>
  );
};

export default LeftSidebarPersona;
