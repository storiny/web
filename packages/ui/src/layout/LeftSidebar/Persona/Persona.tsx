import clsx from "clsx";
import NextLink from "next/link";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Avatar from "~/components/Avatar";
import Image from "~/components/Image";
import Link from "~/components/Link";
import Skeleton from "~/components/Skeleton";
import Typography from "~/components/Typography";
import ErrorState from "~/entities/ErrorState";
import Status from "~/entities/Status";
import PhotoPlusIcon from "~/icons/PhotoPlus";
import { fetchUser } from "~/redux/features";
import { selectAuthStatus, selectUser } from "~/redux/features/auth/selectors";
import { useAppDispatch, useAppSelector } from "~/redux/hooks";
import { abbreviateNumber } from "~/utils/abbreviateNumber";

import styles from "./Persona.module.scss";

const LeftSidebarPersona = (): React.ReactElement => {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus);
  const user = useAppSelector(selectUser);
  const loading = authStatus === "loading";

  if (authStatus === "error") {
    return (
      <ErrorState
        componentProps={{
          button: { loading }
        }}
        retry={(): void => {
          dispatch(fetchUser());
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
          <Skeleton />
        ) : user?.banner_id ? (
          <Image
            alt={""}
            data-testid={"lsb-banner"}
            hex={user.banner_hex}
            imgId={user.banner_id}
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
          avatarId={user?.avatar_id}
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
                fixedColor
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
              {abbreviateNumber(user?.follower_count || 0)}
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
