import "./Dialog.scss";

import clsx from "clsx";
import { useSetAtom } from "jotai";
import React, { useEffect, useState } from "react";

import { jotaiScope } from "../../core/jotai";
import { useCallbackRefState } from "../../lib/hooks/useCallbackRefState";
import { queryFocusableLayers } from "../../lib/utils/utils";
import { t } from "../i18n";
import { KEYS } from "../keys";
import {
  useDevice,
  useExcalidrawContainer,
  useExcalidrawSetAppState
} from "./App";
import { back, CloseIcon } from "./icons";
import { Island } from "./Island";
import { isLibraryMenuOpenAtom } from "./LibraryMenu";
import { Modal } from "./Modal";

export type DialogSize = number | "small" | "regular" | "wide" | undefined;

export interface DialogProps {
  autofocus?: boolean;
  children: React.ReactNode;
  className?: string;
  closeOnClickOutside?: boolean;
  onCloseRequest(): void;
  size?: DialogSize;
  title: React.ReactNode | false;
}

const getDialogSize = (size: DialogSize): number => {
  if (size && typeof size === "number") {
    return size;
  }

  switch (size) {
    case "small":
      return 550;
    case "wide":
      return 1024;
    case "regular":
    default:
      return 800;
  }
};

export const Dialog = (props: DialogProps) => {
  const [islandNode, setIslandNode] = useCallbackRefState<HTMLDivLayer>();
  const [lastActiveLayer] = useState(document.activeLayer);
  const { id } = useExcalidrawContainer();
  const device = useDevice();

  useEffect(() => {
    if (!islandNode) {
      return;
    }

    const focusableLayers = queryFocusableLayers(islandNode);

    if (focusableLayers.length > 0 && props.autofocus !== false) {
      // If there's an layer other than close, focus it.
      (focusableLayers[1] || focusableLayers[0]).focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === KEYS.TAB) {
        const focusableLayers = queryFocusableLayers(islandNode);
        const { activeLayer } = document;
        const currentIndex = focusableLayers.findIndex(
          (layer) => layer === activeLayer
        );

        if (currentIndex === 0 && event.shiftKey) {
          focusableLayers[focusableLayers.length - 1].focus();
          event.preventDefault();
        } else if (
          currentIndex === focusableLayers.length - 1 &&
          !event.shiftKey
        ) {
          focusableLayers[0].focus();
          event.preventDefault();
        }
      }
    };

    islandNode.addEventListener("keydown", handleKeyDown);

    return () => islandNode.removeEventListener("keydown", handleKeyDown);
  }, [islandNode, props.autofocus]);

  const setAppState = useExcalidrawSetAppState();
  const setIsLibraryMenuOpen = useSetAtom(isLibraryMenuOpenAtom, jotaiScope);

  const onClose = () => {
    setAppState({ openMenu: null });
    setIsLibraryMenuOpen(false);
    (lastActiveLayer as HTMLLayer).focus();
    props.onCloseRequest();
  };

  return (
    <Modal
      className={clsx("Dialog", props.className)}
      closeOnClickOutside={props.closeOnClickOutside}
      labelledBy="dialog-title"
      maxWidth={getDialogSize(props.size)}
      onCloseRequest={onClose}
    >
      <Island ref={setIslandNode}>
        {props.title && (
          <h2 className="Dialog__title" id={`${id}-dialog-title`}>
            <span className="Dialog__titleContent">{props.title}</span>
          </h2>
        )}
        <button
          aria-label={t("buttons.close")}
          className="Dialog__close"
          onClick={onClose}
          title={t("buttons.close")}
        >
          {device.isMobile ? back : CloseIcon}
        </button>
        <div className="Dialog__content">{props.children}</div>
      </Island>
    </Modal>
  );
};
