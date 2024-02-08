"use client";

import { animated, useTransition as use_transition } from "@react-spring/web";
import { clsx } from "clsx";
import React from "react";

import Spacer from "~/components/spacer";
import Typography from "~/components/typography";
import css from "~/theme/main.module.scss";

import styles from "./loader.module.scss";

const EditorLoader = ({
  label = "Loading document…",
  overlay,
  hide_progress,
  icon,
  action
  // show
}: {
  action?: React.ReactNode;
  hide_progress?: boolean;
  icon?: React.ReactNode;
  label?: React.ReactNode;
  overlay?: boolean;
  show?: boolean;
}): React.ReactElement => {
  // TODO:
  const show = true;
  const [transitions, api] = use_transition(show, () => ({
    config: { duration: 150 },
    from: { opacity: 1, transform: "scale(1)" },
    enter: { opacity: 1, transform: "scale(1)" },
    leave: { opacity: 0, transform: "scale(0.875)" }
  }));

  React.useLayoutEffect(() => {
    if (!show) {
      setTimeout(api.start);
    }
  }, [api, show]);

  return transitions(
    (style, show) =>
      show && (
        <animated.div
          aria-label={typeof label === "string" ? label : "Loading…"}
          className={clsx(
            css["flex-col"],
            css["flex-center"],
            styles.loader,
            overlay && styles.overlay
          )}
          data-testid={"overlay"}
          style={style}
        >
          {/*TODO: Add !*/}
          {hide_progress ? (
            <video
              autoPlay={true}
              controls={false}
              disablePictureInPicture={true}
              disableRemotePlayback={true}
              height={96}
              loop={true}
              muted={true}
              playsInline={true}
              width={96}
            >
              <source
                src="/assets/b85e9e5e26daee13304b.webm"
                type="video/webm"
              />
              <source src="/assets/9492f371ccf5db4f0156.mp4" type="video/mp4" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" src="/assets/35b6e69b80885d349202.png" />
            </video>
          ) : (
            <React.Fragment>
              {icon}
              <Spacer orientation={"vertical"} size={2} />
            </React.Fragment>
          )}
          <Typography
            className={clsx(css["t-minor"], styles.x, styles.label)}
            level={"body2"}
          >
            {label}
          </Typography>
          {Boolean(action) && (
            <React.Fragment>
              <Spacer orientation={"vertical"} size={2} />
              {action}
            </React.Fragment>
          )}
        </animated.div>
      )
  );
};

export default EditorLoader;
