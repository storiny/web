import { animated, useTransition } from "@react-spring/web";
import { clsx } from "clsx";
import { useAtomValue } from "jotai";
import dynamic from "next/dynamic";
import React from "react";

import Button from "~/components/Button";
import Spinner from "~/components/Spinner";
import { useMediaQuery } from "~/hooks/useMediaQuery";
import { breakpoints } from "~/theme/breakpoints";

import { sidebarsCollapsedAtom } from "../atoms";
import { springConfig } from "../constants";
import styles from "./toolbar.module.scss";

const SuspendedEditorToolbarContent = dynamic(() => import("./content"), {
  loading: ({ isLoading, retry, error }) =>
    error && !isLoading ? (
      <Button color={"ruby"} onClick={retry} size={"sm"} variant={"hollow"}>
        Retry
      </Button>
    ) : (
      <Spinner size={"sm"} />
    )
});

const EditorToolbar = (): React.ReactElement => {
  const isSmallerThanDesktop = useMediaQuery(breakpoints.down("desktop"));
  const sidebarsCollapsed = useAtomValue(sidebarsCollapsedAtom);
  const transitions = useTransition(sidebarsCollapsed || isSmallerThanDesktop, {
    from: { opacity: 1, transform: "translate3d(0,100%,0)" },
    enter: { opacity: 1, transform: "translate3d(0,0%,0)" },
    leave: { opacity: 1, transform: "translate3d(0,100%,0)" },
    config: springConfig
  });

  return (
    <div className={clsx(styles.x, styles.viewport)}>
      {transitions((style, item) =>
        item ? (
          <animated.div
            className={clsx("flex-center", styles.x, styles.toolbar)}
            style={style}
          >
            <SuspendedEditorToolbarContent />
          </animated.div>
        ) : null
      )}
    </div>
  );
};

export default EditorToolbar;
