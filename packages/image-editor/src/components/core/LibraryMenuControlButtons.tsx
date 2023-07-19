import clsx from "clsx";

import { ExcalidrawProps, UIAppState } from "../../core/types";
import LibraryMenuBrowseButton from "./LibraryMenuBrowseButton";

export const LibraryMenuControlButtons = ({
  libraryReturnUrl,
  theme,
  id,
  style,
  children,
  className
}: {
  children?: React.ReactNode;
  className?: string;
  id: string;
  libraryReturnUrl: ExcalidrawProps["libraryReturnUrl"];
  style: React.CSSProperties;
  theme: UIAppState["theme"];
}) => (
  <div
    className={clsx("library-menu-control-buttons", className)}
    style={style}
  >
    <LibraryMenuBrowseButton
      id={id}
      libraryReturnUrl={libraryReturnUrl}
      theme={theme}
    />
    {children}
  </div>
);
