import { download_as_file } from "@storiny/shared/src/utils/download-as-file";
import clsx from "clsx";
import { StaticCanvas } from "fabric";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import Input from "~/components/input";
import Spacer from "~/components/spacer";
import Spinner from "~/components/spinner";
import PaddingIcon from "~/icons/padding";
import { clamp } from "~/utils/clamp";

import { EXPORT_WIDTH, RECOVERY_KEYS } from "../../../constants";
import { use_canvas } from "../../../hooks";
import {
  contains_only_image_objects,
  data_url_to_file,
  recover_object,
  resize_image_file,
  zoom_to_objects
} from "../../../utils";
import styles from "./export-image-modal.module.scss";
import { ExportImageModalProps } from "./export-image-modal.props";

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
    is_confirming,
    on_export_start = (): void => undefined,
    on_export_end = (): void => undefined
  } = props;
  const canvas = use_canvas();
  const export_canvas_ref = React.useRef<HTMLCanvasElement | null>(null);
  const [name, set_name] = React.useState<string>("My sketch");
  const [alt, set_alt] = React.useState<string>("");
  const [padding, set_padding] = React.useState<number>(0);
  const [export_canvas, set_export_canvas] =
    React.useState<StaticCanvas | null>(null);

  /**
   * Exports the convas to image
   */
  const export_to_image = React.useCallback(() => {
    try {
      if (export_canvas) {
        on_export_start();
        zoom_to_objects(export_canvas, padding, true);

        const data = export_canvas.toDataURL({
          format: "png",
          multiplier: 1
        });

        resize_image_file(data_url_to_file(data), {
          max_width_or_height: EXPORT_WIDTH
        }).then((blob) => {
          on_export_end("success", { file: blob, alt });

          if (!is_confirming) {
            download_as_file(blob, name);
          }
        });
      }
    } catch {
      on_export_end("fail");
    }
  }, [
    alt,
    export_canvas,
    is_confirming,
    name,
    on_export_end,
    on_export_start,
    padding
  ]);

  React.useImperativeHandle(
    ref,
    () => ({
      export: export_to_image
    }),
    [export_to_image]
  );

  React.useEffect(() => {
    let current_export_canvas: StaticCanvas | null = null;

    /**
     * Clones the main canvas to an export canvas
     */
    const get_export_canvas = (): Promise<StaticCanvas> => {
      const data = canvas.current.toObject(RECOVERY_KEYS);

      delete data.width;
      delete data.height;

      return new StaticCanvas(export_canvas_ref.current!).loadFromJSON(
        data,
        (prop, object) => {
          recover_object(object, prop);
          object.set({
            id: prop.id,
            name: prop.name,
            seed: prop.seed,
            objectCaching: true // Caching is required for exporting
          });
        }
      );
    };

    get_export_canvas().then((next_canvas) => {
      zoom_to_objects(next_canvas);
      next_canvas.renderAll();

      current_export_canvas = next_canvas;
      set_export_canvas(next_canvas);

      if (!contains_only_image_objects(next_canvas)) {
        set_padding(16);
      }
    });

    return (): void => {
      if (current_export_canvas) {
        current_export_canvas.dispose().then(() => undefined);
      }
    };
  }, [canvas, set_export_canvas, set_padding]);

  React.useEffect(() => {
    if (export_canvas) {
      zoom_to_objects(export_canvas, padding * PADDING_FACTOR);
      export_canvas.renderAll();
    }
  }, [padding, export_canvas]);

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
          ratio={(export_canvas?.width || 1) / (export_canvas?.height || 1)}
          style={{ display: export_canvas ? "block" : "none" }}
          tabIndex={-1}
        >
          <canvas
            className={styles.canvas}
            ref={export_canvas_ref}
            style={{ width: "100%", height: "100%" }}
          />
        </AspectRatio>
        {!export_canvas && <Spinner />}
      </div>
      <div className={"flex"}>
        {is_confirming ? (
          <Input
            aria-label={"Alt text"}
            onChange={(event): void => set_alt(event.target.value)}
            placeholder={"Alt text"}
            size={"sm"}
            slot_props={{
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
            onChange={(event): void => set_name(event.target.value)}
            placeholder={"Name"}
            size={"sm"}
            slot_props={{
              container: {
                className: "f-grow"
              }
            }}
            title={"Name"}
            value={name}
          />
        )}
        <Spacer />
        <Input
          aria-label={"Image padding"}
          decorator={<PaddingIcon />}
          max={MAX_PADDING}
          min={MIN_PADDING}
          monospaced
          onChange={(event): void => {
            const value = Number.parseInt(event.target.value, 10) ?? 0;
            set_padding(clamp(MIN_PADDING, value, MAX_PADDING));
          }}
          placeholder={"Padding"}
          size={"sm"}
          slot_props={{
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
