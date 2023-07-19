import "./EyeDropper.scss";

import { atom } from "jotai";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { EVENT } from "../../core/constants";
import { COLOR_PALETTE, rgbToHex } from "../../lib/color/colors";
import { useCreatePortalContainer } from "../../lib/hooks/useCreatePortalContainer";
import { useOutsideClick } from "../../lib/hooks/useOutsideClick/useOutsideClick";
import { getSelectedLayers } from "../../lib/scene";
import Scene from "../../lib/scene/scene/Scene";
import { useUIAppState } from "../context/ui-editorState";
import { KEYS } from "../keys";
import { mutateLayer } from "../layer/mutateLayer";
import { invalidateShapeForLayer } from "../renderer/renderLayer";
import { useApp, useExcalidrawContainer, useExcalidrawLayers } from "./App";

type EyeDropperProperties = {
  keepOpenOnAlt: boolean;
  onSelect?: (color: string, event: PointerEvent) => void;
  previewType?: "strokeColor" | "backgroundColor";
  swapPreviewOnAlt?: boolean;
};

export const activeEyeDropperAtom = atom<null | EyeDropperProperties>(null);

export const EyeDropper: React.FC<{
  onCancel: () => void;
  onSelect: Required<EyeDropperProperties>["onSelect"];
  previewType?: EyeDropperProperties["previewType"];
  swapPreviewOnAlt?: EyeDropperProperties["swapPreviewOnAlt"];
}> = ({
  onCancel,
  onSelect,
  swapPreviewOnAlt,
  previewType = "backgroundColor"
}) => {
  const eyeDropperContainer = useCreatePortalContainer({
    className: "excalidraw-eye-dropper-backdrop",
    parentSelector: ".excalidraw-eye-dropper-container"
  });
  const editorState = useUIAppState();
  const layers = useExcalidrawLayers();
  const app = useApp();

  const selectedLayers = getSelectedLayers(layers, editorState);

  const metaStuffRef = useRef({ selectedLayers, app });
  metaStuffRef.current.selectedLayers = selectedLayers;
  metaStuffRef.current.app = app;

  const { container: excalidrawContainer } = useExcalidrawContainer();

  useEffect(() => {
    const colorPreviewDiv = ref.current;

    if (!colorPreviewDiv || !app.canvas || !eyeDropperContainer) {
      return;
    }

    let currentColor = COLOR_PALETTE.black;
    let isHoldingPointerDown = false;

    const ctx = app.canvas.getContext("2d")!;

    const mouseMoveListener = ({
      clientX,
      clientY,
      altKey
    }: {
      altKey: boolean;
      clientX: number;
      clientY: number;
    }) => {
      // FIXME swap offset when the preview gets outside viewport
      colorPreviewDiv.style.top = `${clientY + 20}px`;
      colorPreviewDiv.style.left = `${clientX + 20}px`;

      const pixel = ctx.getImageData(
        clientX * window.devicePixelRatio - editorState.offsetLeft,
        clientY * window.devicePixelRatio - editorState.offsetTop,
        1,
        1
      ).data;

      currentColor = rgbToHex(pixel[0], pixel[1], pixel[2]);

      if (isHoldingPointerDown) {
        for (const layer of metaStuffRef.current.selectedLayers) {
          mutateLayer(
            layer,
            {
              [altKey && swapPreviewOnAlt
                ? previewType === "strokeColor"
                  ? "backgroundColor"
                  : "strokeColor"
                : previewType]: currentColor
            },
            false
          );
          invalidateShapeForLayer(layer);
        }
        Scene.getScene(
          metaStuffRef.current.selectedLayers[0]
        )?.informMutation();
      }

      colorPreviewDiv.style.background = currentColor;
    };

    const pointerDownListener = (event: PointerEvent) => {
      isHoldingPointerDown = true;
      // NOTE we can't event.preventDefault() as that would stop
      // pointermove events
      event.stopImmediatePropagation();
    };

    const pointerUpListener = (event: PointerEvent) => {
      isHoldingPointerDown = false;

      // since we're not preventing default on pointerdown, the focus would
      // goes back to `body` so we want to refocus the editor container instead
      excalidrawContainer?.focus();

      event.stopImmediatePropagation();
      event.preventDefault();

      onSelect(currentColor, event);
    };

    const keyDownListener = (event: KeyboardEvent) => {
      if (event.key === KEYS.ESCAPE) {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCancel();
      }
    };

    // -------------------------------------------------------------------------

    eyeDropperContainer.tabIndex = -1;
    // focus container so we can listen on keydown events
    eyeDropperContainer.focus();

    // init color preview else it would show only after the first mouse move
    mouseMoveListener({
      clientX: metaStuffRef.current.app.lastViewportPosition.x,
      clientY: metaStuffRef.current.app.lastViewportPosition.y,
      altKey: false
    });

    eyeDropperContainer.addEventListener(EVENT.KEYDOWN, keyDownListener);
    eyeDropperContainer.addEventListener(
      EVENT.POINTER_DOWN,
      pointerDownListener
    );
    eyeDropperContainer.addEventListener(EVENT.POINTER_UP, pointerUpListener);
    window.addEventListener("pointermove", mouseMoveListener, {
      passive: true
    });
    window.addEventListener(EVENT.BLUR, onCancel);

    return () => {
      isHoldingPointerDown = false;
      eyeDropperContainer.removeEventListener(EVENT.KEYDOWN, keyDownListener);
      eyeDropperContainer.removeEventListener(
        EVENT.POINTER_DOWN,
        pointerDownListener
      );
      eyeDropperContainer.removeEventListener(
        EVENT.POINTER_UP,
        pointerUpListener
      );
      window.removeEventListener("pointermove", mouseMoveListener);
      window.removeEventListener(EVENT.BLUR, onCancel);
    };
  }, [
    app.canvas,
    eyeDropperContainer,
    onCancel,
    onSelect,
    swapPreviewOnAlt,
    previewType,
    excalidrawContainer,
    editorState.offsetLeft,
    editorState.offsetTop
  ]);

  const ref = useRef<HTMLDivLayer>(null);

  useOutsideClick(
    ref,
    () => {
      onCancel();
    },
    (event) => {
      if (
        event.target.closest(
          ".excalidraw-eye-dropper-trigger, .excalidraw-eye-dropper-backdrop"
        )
      ) {
        return true;
      }
      // consider all other clicks as outside
      return false;
    }
  );

  if (!eyeDropperContainer) {
    return null;
  }

  return createPortal(
    <div className="excalidraw-eye-dropper-preview" ref={ref} />,
    eyeDropperContainer
  );
};
