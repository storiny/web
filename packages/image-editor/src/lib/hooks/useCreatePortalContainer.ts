import { useLayoutEffect, useRef, useState } from "react";

import { useDevice, useExcalidrawContainer } from "../../core/components/App";
import { useUIAppState } from "../../core/context/ui-editorState";

export const useCreatePortalContainer = (opts?: {
  className?: string;
  parentSelector?: string;
}): HTMLDivElement | null => {
  const [div, setDiv] = useState<HTMLDivElement | null>(null);
  const device = useDevice();
  const { theme } = useUIAppState();
  const isMobileRef = useRef(device.isMobile);
  isMobileRef.current = device.isMobile;
  const { container: excalidrawContainer } = useExcalidrawContainer();

  useLayoutEffect(() => {
    const container = opts?.parentSelector
      ? excalidrawContainer?.querySelector(opts.parentSelector)
      : document.body;

    if (!container) {
      return;
    }

    const div = document.createElement("div");

    div.classList.add("excalidraw", ...(opts?.className?.split(/\s+/) || []));
    container.appendChild(div);
    setDiv(div);

    return () => {
      container.removeChild(div);
    };
  }, [excalidrawContainer, theme, opts?.className, opts?.parentSelector]);

  return div;
};
