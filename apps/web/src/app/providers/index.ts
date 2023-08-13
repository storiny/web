import { Provider } from "@storiny/shared";
import { TProvider } from "@storiny/types";
import dynamic from "next/dynamic";
import React from "react";

const NullComponent = (): null => null;

export const providerIconMap: Record<TProvider, React.ComponentType> = {
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

export const providerKeyMap: Record<Provider, string> = {
  [Provider.GITHUB]: "github",
  [Provider.DISCORD]: "discord",
  [Provider.FIGMA]: "figma",
  [Provider.DRIBBBLE]: "dribbble",
  [Provider.FACEBOOK]: "facebook",
  [Provider.INSTAGRAM]: "instagram",
  [Provider.LINKED_IN]: "linkedin",
  [Provider.REDDIT]: "reddit",
  [Provider.SNAPCHAT]: "snapchat",
  [Provider.SPOTIFY]: "spotify",
  [Provider.TWITCH]: "twitch",
  [Provider.TWITTER]: "twitter",
  [Provider.YOUTUBE]: "youtube",
  [Provider.UNSPECIFIED]: "",
  [Provider.UNRECOGNIZED]: ""
};

export const providerDisplayNameMap: Record<TProvider, string> = {
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
