import clsx from "clsx";
import { Provider } from "jotai";
import React from "react";

import css from "~/theme/main.module.scss";

import Canvas from "../canvas";
import { FabricProvider, WhiteboardProvider } from "../context";
import Panel from "../panel";
import Tools from "../tools";
import Topbar from "../topbar";
import styles from "./whiteboard.module.scss";
import { WhiteboardProps } from "./whiteboard.props";

const Main = React.forwardRef<HTMLDivElement, WhiteboardProps>((props, ref) => {
  const {
    className,
    on_mount,
    on_confirm,
    on_cancel,
    initial_image_url,
    ...rest
  } = props;

  React.useEffect(() => {
    if (on_mount) {
      on_mount();
    }
  }, [on_mount]);

  return (
    <div
      {...rest}
      className={clsx(css["full-h"], css["full-w"], styles.main, className)}
      ref={ref}
    >
      <Provider>
        <WhiteboardProvider
          value={{ on_confirm, on_cancel, initial_image_url }}
        >
          <FabricProvider>
            <Topbar />
            <Tools />
            <Canvas />
            <Panel />
          </FabricProvider>
        </WhiteboardProvider>
      </Provider>
    </div>
  );
});

Main.displayName = "Whiteboard";

export default Main;
