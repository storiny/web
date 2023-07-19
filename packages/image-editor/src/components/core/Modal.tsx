import "./Modal.scss";

import clsx from "clsx";
import React from "react";
import { createPortal } from "react-dom";

import { AppState } from "../../core/types";
import { useCreatePortalContainer } from "../../lib/hooks/useCreatePortalContainer";
import { KEYS } from "../keys";

export const Modal: React.FC<{
  children: React.ReactNode;
  className?: string;
  closeOnClickOutside?: boolean;
  labelledBy: string;
  maxWidth?: number;
  onCloseRequest(): void;
  theme?: AppState["theme"];
}> = (props) => {
  const { closeOnClickOutside = true } = props;
  const modalRoot = useCreatePortalContainer({
    className: "excalidraw-modal-container"
  });

  if (!modalRoot) {
    return null;
  }

  const handleKeydown = (event: React.KeyboardEvent) => {
    if (event.key === KEYS.ESCAPE) {
      event.nativeEvent.stopImmediatePropagation();
      event.stopPropagation();
      props.onCloseRequest();
    }
  };

  return createPortal(
    <div
      aria-labelledby={props.labelledBy}
      aria-modal="true"
      className={clsx("Modal", props.className)}
      data-prevent-outside-click
      onKeyDown={handleKeydown}
      role="dialog"
    >
      <div
        className="Modal__background"
        onClick={closeOnClickOutside ? props.onCloseRequest : undefined}
      />
      <div
        className="Modal__content"
        style={{ "--max-width": `${props.maxWidth}px` }}
        tabIndex={0}
      >
        {props.children}
      </div>
    </div>,
    modalRoot
  );
};
