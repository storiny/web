"use client";

import { ImageSize } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Divider from "~/components/Divider";
import IconButton from "~/components/IconButton";
import Image from "~/components/Image";
import Typography from "~/components/Typography";
import PageTitle from "~/entities/PageTitle";
import PencilIcon from "~/icons/Pencil";
import TrashIcon from "~/icons/Trash";
import { selectUser } from "~/redux/features";
import { useAppSelector } from "~/redux/hooks";
import { breakpoints } from "~/theme/breakpoints";
import { getCdnUrl } from "~/utils/getCdnUrl";

import AccountProfileRightSidebar from "./right-sidebar";
import styles from "./styles.module.scss";

const Banner = (): React.ReactElement => {
  const user = useAppSelector(selectUser)!;
  return (
    <AspectRatio
      className={clsx(styles.x, styles["aspect-ratio"])}
      ratio={4.45}
    >
      <Image
        alt={""}
        className={clsx(styles.x, styles.banner)}
        hex={user.banner_hex}
        imgId={user.banner_id}
        slotProps={{
          image: {
            sizes: [
              `${breakpoints.up("desktop")} 680px`,
              `${breakpoints.up("mobile")} calc(100vw - 72px)`,
              "100vw"
            ].join(","),
            srcSet: [
              `${getCdnUrl(user.banner_id, ImageSize.W_1440)} 1440w`,
              `${getCdnUrl(user.banner_id, ImageSize.W_1024)} 1024w`,
              `${getCdnUrl(user.banner_id, ImageSize.W_860)} 860w`,
              `${getCdnUrl(user.banner_id, ImageSize.W_640)} 640w`,
              `${getCdnUrl(user.banner_id, ImageSize.W_320)} 320w`
            ].join(",")
          }
        }}
      />
      <div
        className={clsx(
          "force-light-mode",
          "flex-center",
          styles.x,
          styles["banner-actions"]
        )}
      >
        <IconButton aria-label={"Edit banner"} title={"Edit banner"}>
          <PencilIcon />
        </IconButton>
        <IconButton aria-label={"Remove banner"} title={"Remove banner"}>
          <TrashIcon />
        </IconButton>
      </div>
    </AspectRatio>
  );
};

const Page = (): React.ReactElement => (
  <React.Fragment>
    <main>
      <PageTitle dashboard hideBackButton>
        <h1>Public profile</h1>
      </PageTitle>
      <Banner />
      <div className={clsx("flex-col", styles.x, styles.wrapper)}>
        <div className={clsx("flex-col", styles.x, styles.group)}>
          <Typography as={"h2"} level={"h4"}>
            General
          </Typography>
        </div>
        <Divider />
        <div className={clsx("flex-col", styles.x, styles.group)}>
          <Typography as={"h2"} level={"h4"}>
            Username
          </Typography>
        </div>
        <Divider />
        <div className={clsx("flex-col", styles.x, styles.group)}>
          <Typography as={"h2"} level={"h4"}>
            Connections
          </Typography>
        </div>
      </div>
    </main>
    <AccountProfileRightSidebar />
  </React.Fragment>
);

export default Page;
