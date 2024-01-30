import { ConnectionProvider } from "@storiny/shared";
import dynamic from "next/dynamic";
import React from "react";

export const PROVIDER_ICON_MAP: Record<
  ConnectionProvider,
  React.ComponentType
> = {
  [ConnectionProvider.DISCORD /*     */]: dynamic(
    () => import("~/icons/discord")
  ),
  [ConnectionProvider.DRIBBBLE /*    */]: dynamic(
    () => import("~/icons/dribbble")
  ),
  [ConnectionProvider.FIGMA /*       */]: dynamic(
    () => import("~/icons/figma")
  ),
  [ConnectionProvider.GITHUB /*      */]: dynamic(
    () => import("~/icons/git-hub")
  ),
  [ConnectionProvider.LINKEDIN /*    */]: dynamic(
    () => import("~/icons/linked-in")
  ),
  [ConnectionProvider.REDDIT /*      */]: dynamic(
    () => import("~/icons/reddit")
  ),
  [ConnectionProvider.SNAPCHAT /*    */]: dynamic(
    () => import("~/icons/snapchat")
  ),
  [ConnectionProvider.SPOTIFY /*     */]: dynamic(
    () => import("~/icons/spotify")
  ),
  [ConnectionProvider.YOUTUBE /*     */]: dynamic(
    () => import("~/icons/you-tube")
  ),
  [ConnectionProvider.TWITCH /*      */]: dynamic(
    () => import("~/icons/twitch")
  )
};

export const PROVIDER_DISPLAY_NAME_MAP: Record<ConnectionProvider, string> = {
  [ConnectionProvider.DISCORD /*     */]: "Discord",
  [ConnectionProvider.DRIBBBLE /*    */]: "Dribbble",
  [ConnectionProvider.FIGMA /*       */]: "Figma",
  [ConnectionProvider.GITHUB /*      */]: "GitHub",
  [ConnectionProvider.LINKEDIN /*    */]: "LinkedIn",
  [ConnectionProvider.REDDIT /*      */]: "Reddit",
  [ConnectionProvider.SNAPCHAT /*    */]: "Snapchat",
  [ConnectionProvider.SPOTIFY /*     */]: "Spotify",
  [ConnectionProvider.YOUTUBE /*     */]: "YouTube",
  [ConnectionProvider.TWITCH /*      */]: "Twitch"
};
