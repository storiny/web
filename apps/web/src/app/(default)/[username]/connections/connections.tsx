import { Provider } from "@storiny/shared";
import { TProvider } from "@storiny/types";
import { clsx } from "clsx";
import dynamic from "next/dynamic";
import React from "react";

import { GetProfileResponse } from "~/common/grpc";
import IconButton from "~/components/IconButton";

import styles from "./connections.module.scss";

interface Props {
  connections: GetProfileResponse["connections"];
  isInsideSidebar?: boolean;
  name: string;
}

const NullComponent = (): null => null;

const providerIconMap: Record<TProvider, React.ComponentType> = {
  [Provider.TWITTER]: dynamic(() => import("~/icons/Twitter")),
  [Provider.DISCORD]: dynamic(() => import("~/icons/Discord")),
  [Provider.DRIBBBLE]: dynamic(() => import("~/icons/Dribbble")),
  [Provider.FIGMA]: dynamic(() => import("~/icons/Figma")),
  [Provider.GITHUB]: dynamic(() => import("~/icons/GitHub")),
  [Provider.FACEBOOK]: dynamic(() => import("~/icons/Facebook")),
  [Provider.INSTAGRAM]: dynamic(() => import("~/icons/Instagram")),
  [Provider.LINKED_IN]: dynamic(() => import("~/icons/LinkedIn")),
  [Provider.REDDIT]: dynamic(() => import("~/icons/Reddit")),
  [Provider.SNAPCHAT]: dynamic(() => import("~/icons/Snapchat")),
  [Provider.SPOTIFY]: dynamic(() => import("~/icons/Spotify")),
  [Provider.YOUTUBE]: dynamic(() => import("~/icons/YouTube")),
  [Provider.TWITCH]: dynamic(() => import("~/icons/Twitch")),
  [Provider.UNSPECIFIED]: NullComponent,
  [Provider.UNRECOGNIZED]: NullComponent
};

const providerDisplayNameMap: Record<TProvider, string> = {
  [Provider.TWITTER]: "Twitter",
  [Provider.DISCORD]: "Discord",
  [Provider.DRIBBBLE]: "Dribbble",
  [Provider.FIGMA]: "Figma",
  [Provider.GITHUB]: "GitHub",
  [Provider.FACEBOOK]: "Facebook",
  [Provider.INSTAGRAM]: "Instagram",
  [Provider.LINKED_IN]: "LinkedIn",
  [Provider.REDDIT]: "Reddit",
  [Provider.SNAPCHAT]: "Snapchat",
  [Provider.SPOTIFY]: "Spotify",
  [Provider.YOUTUBE]: "YouTube",
  [Provider.TWITCH]: "Twitch",
  [Provider.UNSPECIFIED]: "",
  [Provider.UNRECOGNIZED]: ""
};

const Connections = ({
  connections,
  name,
  isInsideSidebar
}: Props): React.ReactElement => (
  <div className={clsx("flex", styles.x, styles.connections)}>
    {connections.map((connection) => (
      <IconButton
        aria-label={`${name} on ${providerDisplayNameMap[connection.provider]}`}
        as={"a"}
        className={clsx(styles.x, styles.connection)}
        href={connection.url}
        key={connection.provider}
        rel={"noreferrer"}
        size={isInsideSidebar ? "md" : "lg"}
        target={"_blank"}
        title={`${name} on ${providerDisplayNameMap[connection.provider]}`}
        variant={"ghost"}
      >
        {React.createElement(providerIconMap[connection.provider])}
      </IconButton>
    ))}
  </div>
);

export default Connections;
