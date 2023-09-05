import { clsx } from "clsx";
import React from "react";
import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

import Typography from "~/components/Typography";

import styles from "./error-boundary.module.scss";
import { EditorErrorBoundaryProps } from "./error-boundary.props";

const EditorErrorBoundary = ({
  children,
  onError
}: EditorErrorBoundaryProps): React.ReactElement => (
  <ReactErrorBoundary
    fallback={
      <div className={clsx("flex-center", styles["error-boundary"])}>
        <Typography level={"body2"} style={{ color: "inherit" }}>
          Unable to render this node
        </Typography>
      </div>
    }
    onError={onError}
  >
    {children}
  </ReactErrorBoundary>
);

export default EditorErrorBoundary;
