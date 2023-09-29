import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import AspectRatio from "src/components/aspect-ratio";
import Avatar from "src/components/avatar";
import Image from "src/components/image";
import Link from "src/components/link";
import Skeleton from "src/components/skeleton";
import Typography from "src/components/typography";
import ErrorState from "src/entities/error-state";
import Status from "src/entities/status";
import PhotoPlusIcon from "~/icons/PhotoPlus";
import { fetch_user } from "~/redux/features";
import {
  select_auth_status,
  select_user
} from "~/redux/features/auth/selectors";
import { use_app_dispatch, use_app_selector } from "~/redux/hooks";
import { abbreviate_number } from "src/utils/abbreviate-number";

import styles from "./persona.module.scss";

const LeftSidebarPersona = (): React.ReactElement => {
  const dispatch = use_app_dispatch();
  const auth_state = use_app_selector(select_auth_status);
  const user = use_app_selector(select_user);
  const loading = auth_state === "loading";

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
            className={clsx("flex-center", styles["banner-placeholder"])}
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
      <div className={clsx("flex-center", styles.meta)}>
        {loading ? (
          <>
            <span className={"flex-col"} style={{ gap: "8px" }}>
              <Skeleton height={16} width={72} />
              <Skeleton height={14} width={96} />
            </span>
            <span
              className={"flex-col"}
              style={{ gap: "8px", alignItems: "center" }}
            >
              <Skeleton height={16} width={72} />
              <Skeleton height={14} width={96} />
            </span>
          </>
        ) : (
          <>
            <div className={"flex-col"}>
              <Link
                className={clsx("t-bold")}
                ellipsis
                fixed_color
                href={"/profile"}
                level={"body1"}
              >
                {user?.name}
              </Link>
              <Link
                className={clsx("t-minor", "t-medium")}
                ellipsis
                href={"/profile"}
                level={"body2"}
              >
                @{user?.username}
              </Link>
            </div>
            <Typography className={clsx("flex-col", styles["follower-count"])}>
              {abbreviate_number(user?.follower_count || 0)}
              <Typography className={clsx("t-minor")} level={"body2"}>
                followers
              </Typography>
            </Typography>
          </>
        )}
      </div>
      {loading ? <Skeleton height={30} /> : <Status editable />}
    </>
  );
};

export default LeftSidebarPersona;
