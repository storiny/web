import { Provider } from "@storiny/shared";
import { TProvider } from "@storiny/types";
import dynamic from "next/dynamic";
import React from "react";

const NullComponent = (): null => null;

export const providerIconMap: Record<TProvider, React.ComponentType> = {
  [Provider.TWITTER /*     */]: dynamic(
    () => import("../../../../../packages/ui/src/icons/twitter")
  ),
  [Provider.DISCORD /*     */]: dynamic(
    () => import("../../../../../packages/ui/src/icons/discord")
  ),
  [Provider.DRIBBBLE /*    */]: dynamic(
    () => import("../../../../../packages/ui/src/icons/dribbble")
  ),
  [Provider.FIGMA /*       */]: dynamic(
    () => import("../../../../../packages/ui/src/icons/figma")
  ),
  [Provider.GITHUB /*      */]: dynamic(
    () => import("../../../../../packages/ui/src/icons/git-hub")
  ),
  [Provider.FACEBOOK /*    */]: dynamic(
    () => import("../../../../../packages/ui/src/icons/facebook")
  ),
  [Provider.INSTAGRAM /*   */]: dynamic(
    () => import("../../../../../packages/ui/src/icons/instagram")
  ),
  [Provider.LINKED_IN /*   */]: dynamic(
    () => import("../../../../../packages/ui/src/icons/linked-in")
  ),
  [Provider.REDDIT /*      */]: dynamic(
    () => import("../../../../../packages/ui/src/icons/reddit")
  ),
  [Provider.SNAPCHAT /*    */]: dynamic(
    () => import("../../../../../packages/ui/src/icons/snapchat")
  ),
  [Provider.SPOTIFY /*     */]: dynamic(
    () => import("../../../../../packages/ui/src/icons/spotify")
  ),
  [Provider.YOUTUBE /*     */]: dynamic(
    () => import("../../../../../packages/ui/src/icons/you-tube")
  ),
  [Provider.TWITCH /*      */]: dynamic(
    () => import("../../../../../packages/ui/src/icons/twitch")
  ),
  [Provider.UNSPECIFIED /* */]: NullComponent,
  [Provider.UNRECOGNIZED /**/]: NullComponent
};

export const providerKeyMap: Record<Provider, string> = {
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

export const providerDisplayNameMap: Record<TProvider, string> = {
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
