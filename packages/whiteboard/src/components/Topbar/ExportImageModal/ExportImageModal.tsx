import { downloadAsFile } from "@storiny/shared/src/utils/downloadAsFile";
import clsx from "clsx";
import { StaticCanvas } from "fabric";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import Input from "~/components/Input";
import Spacer from "~/components/Spacer";
import Spinner from "~/components/Spinner";
import PaddingIcon from "~/icons/Padding";
import { clamp } from "~/utils/clamp";

import { EXPORT_WIDTH, recoveryKeys } from "../../../constants";
import { useCanvas } from "../../../hooks";
import {
  containsOnlyImageObjects,
  dataURLToFile,
  recoverObject,
  resizeImageFile,
  zoomToObjects
} from "../../../utils";
import styles from "./ExportImageModal.module.scss";
import { ExportImageModalProps } from "./ExportImageModal.props";

export type ExportHandleRef = {
  export: () => void;
};

const MAX_PADDING = 100;
const MIN_PADDING = 0;
const PADDING_FACTOR = 10;

// Modal

const ExportImageModal = React.forwardRef<
  ExportHandleRef,
  ExportImageModalProps
>((props, ref) => {
  const {
    isConfirming,
    onExportStart = (): void => undefined,
    onExportEnd = (): void => undefined
  } = props;
  const canvas = useCanvas();
  const exportCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [name, setName] = React.useState<string>("My sketch");
  const [alt, setAlt] = React.useState<string>("");
  const [padding, setPadding] = React.useState<number>(0);
  const [exportCanvas, setExportCanvas] = React.useState<StaticCanvas | null>(
    null
  );

  /**
   * Exports the convas to image
   */
  const exportToImage = React.useCallback(() => {
    try {
      if (exportCanvas) {
        onExportStart();
        zoomToObjects(exportCanvas, padding, true);

        const data = exportCanvas.toDataURL({
          format: "png",
          multiplier: 1
        });

        resizeImageFile(dataURLToFile(data), {
          maxWidthOrHeight: EXPORT_WIDTH
        }).then((blob) => {
          onExportEnd("success", { file: blob, alt });

          if (!isConfirming) {
            downloadAsFile(blob, name);
          }
        });
      }
    } catch (e) {
      onExportEnd("fail");
    }
  }, [
    alt,
    exportCanvas,
    isConfirming,
    name,
    onExportEnd,
    onExportStart,
    padding
  ]);

  React.useImperativeHandle(
    ref,
    () => ({
      export: exportToImage
    }),
    [exportToImage]
  );

  React.useEffect(() => {
    let currentExportCanvas: StaticCanvas | null = null;

    /**
     * Clones the main canvas to an export canvas
     */
    const getExportCanvas = (): Promise<StaticCanvas> => {
      const data = canvas.current.toObject(recoveryKeys);

      delete data.width;
      delete data.height;

      return new StaticCanvas(exportCanvasRef.current!).loadFromJSON(
        data,
        (prop, object) => {
          recoverObject(object, prop);
          object.set({
            id: prop.id,
            name: prop.name,
            seed: prop.seed,
            objectCaching: true // Caching is required for exporting
          });
        }
      );
    };

    getExportCanvas().then((newCanvas) => {
      zoomToObjects(newCanvas);
      newCanvas.renderAll();

      currentExportCanvas = newCanvas;
      setExportCanvas(newCanvas);

      if (!containsOnlyImageObjects(newCanvas)) {
        setPadding(16);
      }
    });

    return (): void => {
      if (currentExportCanvas) {
        currentExportCanvas.dispose().then(() => undefined);
      }
    };
  }, [canvas, setExportCanvas, setPadding]);

  React.useEffect(() => {
    if (exportCanvas) {
      zoomToObjects(exportCanvas, padding * PADDING_FACTOR);
      exportCanvas.renderAll();
    }
  }, [padding, exportCanvas]);

  if (!canvas.current) {
    return null;
  }

  return (
    <div className={clsx("flex-col", styles.container)}>
      <div className={clsx("flex-center", styles["canvas-container"])}>
        <div
          aria-hidden
          className={clsx("invert", styles["canvas-background"])}
        />
        <AspectRatio
          ratio={(exportCanvas?.width || 1) / (exportCanvas?.height || 1)}
          style={{ display: exportCanvas ? "block" : "none" }}
          tabIndex={-1}
        >
          <canvas
            className={styles.canvas}
            ref={exportCanvasRef}
            style={{ width: "100%", height: "100%" }}
          />
        </AspectRatio>
        {!exportCanvas && <Spinner />}
      </div>
      <div className={"flex"}>
        {isConfirming ? (
          <Input
            aria-label={"Alt text"}
            onChange={(event): void => setAlt(event.target.value)}
            placeholder={"Alt text"}
            size={"sm"}
            slotProps={{
              container: {
                className: "f-grow"
              }
            }}
            title={"Alt text"}
            value={alt}
          />
        ) : (
          <Input
            aria-label={"Image name"}
            onChange={(event): void => setName(event.target.value)}
            placeholder={"Name"}
            size={"sm"}
            slotProps={{
              container: {
                className: "f-grow"
              }
            }}
            title={"Name"}
            value={name}
          />
        )}
        <Spacer size={1} />
        <Input
          aria-label={"Image padding"}
          decorator={<PaddingIcon />}
          max={MAX_PADDING}
          min={MIN_PADDING}
          monospaced
          onChange={(event): void => {
            const value = Number.parseInt(event.target.value, 10) ?? 0;
            setPadding(clamp(MIN_PADDING, value, MAX_PADDING));
          }}
          placeholder={"Padding"}
          size={"sm"}
          slotProps={{
            container: {
              style: {
                flex: "0.4"
              }
            }
          }}
          title={"Padding"}
          type={"number"}
          value={padding}
        />
      </div>
    </div>
  );
});

ExportImageModal.displayName = "ExportImageModal";

export default ExportImageModal;
