import { Provider } from "@storiny/shared";
import { TProvider } from "@storiny/types";
import dynamic from "next/dynamic";
import React from "react";

const NullComponent = (): null => null;

export const PROVIDER_ICON_MAP: Record<TProvider, React.ComponentType> = {
  [Provider.TWITTER /*     */]: dynamic(() => import("~/icons/twitter")),
  [Provider.DISCORD /*     */]: dynamic(() => import("~/icons/discord")),
  [Provider.DRIBBBLE /*    */]: dynamic(() => import("~/icons/dribbble")),
  [Provider.FIGMA /*       */]: dynamic(() => import("~/icons/figma")),
  [Provider.GITHUB /*      */]: dynamic(() => import("~/icons/git-hub")),
  [Provider.FACEBOOK /*    */]: dynamic(() => import("~/icons/facebook")),
  [Provider.INSTAGRAM /*   */]: dynamic(() => import("~/icons/instagram")),
  [Provider.LINKED_IN /*   */]: dynamic(() => import("~/icons/linked-in")),
  [Provider.REDDIT /*      */]: dynamic(() => import("~/icons/reddit")),
  [Provider.SNAPCHAT /*    */]: dynamic(() => import("~/icons/snapchat")),
  [Provider.SPOTIFY /*     */]: dynamic(() => import("~/icons/spotify")),
  [Provider.YOUTUBE /*     */]: dynamic(() => import("~/icons/you-tube")),
  [Provider.TWITCH /*      */]: dynamic(() => import("~/icons/twitch")),
  [Provider.UNSPECIFIED /* */]: NullComponent,
  [Provider.UNRECOGNIZED /**/]: NullComponent
};

export const PROVIDER_KEY_MAP: Record<Provider, string> = {
  [Provider.GITHUB /*      */]: "github",
  [Provider.DISCORD /*     */]: "discord",
  [Provider.FIGMA /*       */]: "figma",
  [Provider.DRIBBBLE /*    */]: "dribbble",
  [Provider.FACEBOOK /*    */]: "facebook",
  [Provider.INSTAGRAM /*   */]: "instagram",
  [Provider.LINKED_IN /*   */]: "linkedin",
  [Provider.REDDIT /*      */]: "reddit",
  [Provider.SNAPCHAT /*    */]: "snapchat",
  [Provider.SPOTIFY /*     */]: "spotify",
  [Provider.TWITCH /*      */]: "twitch",
  [Provider.TWITTER /*     */]: "twitter",
  [Provider.YOUTUBE /*     */]: "youtube",
  [Provider.UNSPECIFIED /* */]: "",
  [Provider.UNRECOGNIZED /**/]: ""
};

export const PROVIDER_DISPLAY_NAME_MAP: Record<TProvider, string> = {
  [Provider.TWITTER /*     */]: "Twitter",
  [Provider.DISCORD /*     */]: "Discord",
  [Provider.DRIBBBLE /*    */]: "Dribbble",
  [Provider.FIGMA /*       */]: "Figma",
  [Provider.GITHUB /*      */]: "GitHub",
  [Provider.FACEBOOK /*    */]: "Facebook",
  [Provider.INSTAGRAM /*   */]: "Instagram",
  [Provider.LINKED_IN /*   */]: "LinkedIn",
  [Provider.REDDIT /*      */]: "Reddit",
  [Provider.SNAPCHAT /*    */]: "Snapchat",
  [Provider.SPOTIFY /*     */]: "Spotify",
  [Provider.YOUTUBE /*     */]: "YouTube",
  [Provider.TWITCH /*      */]: "Twitch",
  [Provider.UNSPECIFIED /* */]: "",
  [Provider.UNRECOGNIZED /**/]: ""
};
