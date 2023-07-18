import {
  canChangeRoundness,
  canHaveArrowheads,
  getCommonAttributeOfSelectedLayers,
  getSelectedLayers,
  getTargetLayers,
  isSomeLayerSelected,
} from "../../lib/scene";
import { hasStrokeColor } from "../../lib/scene/comparisons";
import { AppState } from "../../src/types";
import { trackEvent } from "../analytics";
import {
  DEFAULT_ELEMENT_BACKGROUND_COLOR_PALETTE,
  DEFAULT_ELEMENT_BACKGROUND_PICKS,
  DEFAULT_ELEMENT_STROKE_COLOR_PALETTE,
  DEFAULT_ELEMENT_STROKE_PICKS,
} from "../colors";
import { ButtonIconSelect } from "../components/ButtonIconSelect";
import { ColorPicker } from "../components/ColorPicker/ColorPicker";
import { IconPicker } from "../components/IconPicker";
// TODO barnabasmolnar/editor-redesign
// TextAlignTopIcon, TextAlignBottomIcon,TextAlignMiddleIcon,
// ArrowHead icons
import {
  ArrowheadArrowIcon,
  ArrowheadBarIcon,
  ArrowheadDotIcon,
  ArrowheadNoneIcon,
  ArrowheadTriangleIcon,
  EdgeRoundIcon,
  EdgeSharpIcon,
  FillCrossHatchIcon,
  FillHachureIcon,
  FillSolidIcon,
  FillZigZagIcon,
  FontFamilyCodeIcon,
  FontFamilyNormalIcon,
  FontSizeExtraLargeIcon,
  FontSizeLargeIcon,
  FontSizeMediumIcon,
  FontSizeSmallIcon,
  FreedrawIcon,
  SloppinessArchitectIcon,
  SloppinessArtistIcon,
  SloppinessCartoonistIcon,
  StrokeStyleDashedIcon,
  StrokeStyleDottedIcon,
  StrokeWidthBaseIcon,
  StrokeWidthBoldIcon,
  StrokeWidthExtraBoldIcon,
  TextAlignBottomIcon,
  TextAlignCenterIcon,
  TextAlignLeftIcon,
  TextAlignMiddleIcon,
  TextAlignRightIcon,
  TextAlignTopIcon,
} from "../components/icons";
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  FONT_FAMILY,
  ROUNDNESS,
  VERTICAL_ALIGN,
} from "../constants";
import { getLanguage, t } from "../i18n";
import { KEYS } from "../keys";
import {
  getNonDeletedLayers,
  isTextLayer,
  redrawTextBoundingBox,
} from "../layer";
import { mutateLayer, newLayerWith } from "../layer/mutateLayer";
import {
  getBoundTextLayer,
  getContainerLayer,
  getDefaultLineHeight,
} from "../layer/textLayer";
import {
  isBoundToContainer,
  isLinearLayer,
  isUsingAdaptiveRadius,
} from "../layer/typeChecks";
import {
  Arrowhead,
  ExcalidrawLayer,
  ExcalidrawLinearLayer,
  ExcalidrawTextLayer,
  FontFamilyValues,
  TextAlign,
  VerticalAlign,
} from "../layer/types";
import { randomInteger } from "../random";
import { arrayToMap, getShortcutKey } from "../../lib/utils/utils";
import { register } from "./register";

const FONT_SIZE_RELATIVE_INCREASE_STEP = 0.1;

const changeProperty = (
  layers: readonly ExcalidrawLayer[],
  editorState: AppState,
  callback: (layer: ExcalidrawLayer) => ExcalidrawLayer,
  includeBoundText = false,
) => {
  const selectedLayerIds = arrayToMap(
    getSelectedLayers(layers, editorState, {
      includeBoundTextLayer: includeBoundText,
    }),
  );

  return layers.map((layer) => {
    if (
      selectedLayerIds.get(layer.id) ||
      layer.id === editorState.editingLayer?.id
    ) {
      return callback(layer);
    }
    return layer;
  });
};

const getFormValue = <T>(layers: readonly ExcalidrawLayer[], editorState: AppState, getAttribute: (layer: ExcalidrawLayer) => T, defaultValue: T): T => {
  const editingLayer = editorState.editingLayer;
  const nonDeletedLayers = getNonDeletedLayers(layers);
  return (
    (editingLayer && getAttribute(editingLayer)) ??
    (isSomeLayerSelected(nonDeletedLayers, editorState)
      ? getCommonAttributeOfSelectedLayers(
          nonDeletedLayers,
          editorState,
          getAttribute,
        )
      : defaultValue) ??
    defaultValue
  );
};

const offsetLayerAfterFontResize = (
  prevLayer: ExcalidrawTextLayer,
  nextLayer: ExcalidrawTextLayer,
) => {
  if (isBoundToContainer(nextLayer)) {
    return nextLayer;
  }
  return mutateLayer(
    nextLayer,
    {
      x:
        prevLayer.textAlign === "left"
          ? prevLayer.x
          : prevLayer.x +
            (prevLayer.width - nextLayer.width) /
              (prevLayer.textAlign === "center" ? 2 : 1),
      // centering vertically is non-standard, but for Excalidraw I think
      // it makes sense
      y: prevLayer.y + (prevLayer.height - nextLayer.height) / 2,
    },
    false,
  );
};

const changeFontSize = (
  layers: readonly ExcalidrawLayer[],
  editorState: AppState,
  getNewFontSize: (layer: ExcalidrawTextLayer) => number,
  fallbackValue?: ExcalidrawTextLayer["fontSize"],
) => {
  const newFontSizes = new Set<number>();

  return {
    layers: changeProperty(
      layers,
      editorState,
      (oldLayer) => {
        if (isTextLayer(oldLayer)) {
          const newFontSize = getNewFontSize(oldLayer);
          newFontSizes.add(newFontSize);

          let newLayer: ExcalidrawTextLayer = newLayerWith(oldLayer, {
            fontSize: newFontSize,
          });
          redrawTextBoundingBox(newLayer, getContainerLayer(oldLayer));

          newLayer = offsetLayerAfterFontResize(oldLayer, newLayer);

          return newLayer;
        }

        return oldLayer;
      },
      true,
    ),
    editorState: {
      ...editorState,
      // update state only if we've set all select text layers to
      // the same font size
      currentItemFontSize:
        newFontSizes.size === 1
          ? [...newFontSizes][0]
          : fallbackValue ?? editorState.currentItemFontSize,
    },
    commitToHistory: true,
  };
};

// -----------------------------------------------------------------------------

export const actionChangeStrokeColor = register({
  name: "changeStrokeColor",
  trackEvent: false,
  perform: (layers, editorState, value) => ({
      ...(value.currentItemStrokeColor && {
        layers: changeProperty(
          layers,
          editorState,
          (el) => {
            return hasStrokeColor(el.type)
              ? newLayerWith(el, {
                  strokeColor: value.currentItemStrokeColor,
                })
              : el;
          },
          true,
        ),
      }),
      editorState: {
        ...editorState,
        ...value,
      },
      commitToHistory: !!value.currentItemStrokeColor,
    }),
  PanelComponent: ({ layers, editorState, updateData, appProps }) => (
    <>
      <h3 aria-hidden="true">{t("labels.stroke")}</h3>
      <ColorPicker
        editorState={editorState}
        color={getFormValue(
          layers,
          editorState,
          (layer) => layer.strokeColor,
          editorState.currentItemStrokeColor,
        )}
        label={t("labels.stroke")}
        layers={layers}
        onChange={(color) => updateData({ currentItemStrokeColor: color })}
        palette={DEFAULT_ELEMENT_STROKE_COLOR_PALETTE}
        topPicks={DEFAULT_ELEMENT_STROKE_PICKS}
        type="layerStroke"
        updateData={updateData}
      />
    </>
  ),
});

export const actionChangeBackgroundColor = register({
  name: "changeBackgroundColor",
  trackEvent: false,
  perform: (layers, editorState, value) => ({
      ...(value.currentItemBackgroundColor && {
        layers: changeProperty(layers, editorState, (el) =>
          newLayerWith(el, {
            backgroundColor: value.currentItemBackgroundColor,
          }),
        ),
      }),
      editorState: {
        ...editorState,
        ...value,
      },
      commitToHistory: !!value.currentItemBackgroundColor,
    }),
  PanelComponent: ({ layers, editorState, updateData, appProps }) => (
    <>
      <h3 aria-hidden="true">{t("labels.background")}</h3>
      <ColorPicker
        editorState={editorState}
        color={getFormValue(
          layers,
          editorState,
          (layer) => layer.backgroundColor,
          editorState.currentItemBackgroundColor,
        )}
        label={t("labels.background")}
        layers={layers}
        onChange={(color) => updateData({ currentItemBackgroundColor: color })}
        palette={DEFAULT_ELEMENT_BACKGROUND_COLOR_PALETTE}
        topPicks={DEFAULT_ELEMENT_BACKGROUND_PICKS}
        type="layerBackground"
        updateData={updateData}
      />
    </>
  ),
});

export const actionChangeFillStyle = register({
  name: "changeFillStyle",
  trackEvent: false,
  perform: (layers, editorState, value, app) => {
    trackEvent(
      "layer",
      "changeFillStyle",
      `${value} (${app.device.isMobile ? "mobile" : "desktop"})`,
    );
    return {
      layers: changeProperty(layers, editorState, (el) =>
        newLayerWith(el, {
          fillStyle: value,
        }),
      ),
      editorState: { ...editorState, currentItemFillStyle: value },
      commitToHistory: true,
    };
  },
  PanelComponent: ({ layers, editorState, updateData }) => {
    const selectedLayers = getSelectedLayers(layers, editorState);
    const allLayersZigZag =
      selectedLayers.length > 0 &&
      selectedLayers.every((el) => el.fillStyle === "zigzag");

    return (
      <fieldset>
        <legend>{t("labels.fill")}</legend>
        <ButtonIconSelect
          onClick={(value, event) => {
            const nextValue =
              event.altKey &&
              value === "hachure" &&
              selectedLayers.every((el) => el.fillStyle === "hachure")
                ? "zigzag"
                : value;

            updateData(nextValue);
          }}
          options={[
            {
              value: "hachure",
              text: `${
                allLayersZigZag ? t("labels.zigzag") : t("labels.hachure")
              } (${getShortcutKey("Alt-Click")})`,
              icon: allLayersZigZag ? FillZigZagIcon : FillHachureIcon,
              active: allLayersZigZag ? true : undefined,
            },
            {
              value: "cross-hatch",
              text: t("labels.crossHatch"),
              icon: FillCrossHatchIcon,
            },
            {
              value: "solid",
              text: t("labels.solid"),
              icon: FillSolidIcon,
            },
          ]}
          type="button"
          value={getFormValue(
            layers,
            editorState,
            (layer) => layer.fillStyle,
            editorState.currentItemFillStyle,
          )}
        />
      </fieldset>
    );
  },
});

export const actionChangeStrokeWidth = register({
  name: "changeStrokeWidth",
  trackEvent: false,
  perform: (layers, editorState, value) => ({
      layers: changeProperty(layers, editorState, (el) =>
        newLayerWith(el, {
          strokeWidth: value,
        }),
      ),
      editorState: { ...editorState, currentItemStrokeWidth: value },
      commitToHistory: true,
    }),
  PanelComponent: ({ layers, editorState, updateData }) => (
    <fieldset>
      <legend>{t("labels.strokeWidth")}</legend>
      <ButtonIconSelect
        group="stroke-width"
        onChange={(value) => updateData(value)}
        options={[
          {
            value: 1,
            text: t("labels.thin"),
            icon: StrokeWidthBaseIcon,
          },
          {
            value: 2,
            text: t("labels.bold"),
            icon: StrokeWidthBoldIcon,
          },
          {
            value: 4,
            text: t("labels.extraBold"),
            icon: StrokeWidthExtraBoldIcon,
          },
        ]}
        value={getFormValue(
          layers,
          editorState,
          (layer) => layer.strokeWidth,
          editorState.currentItemStrokeWidth,
        )}
      />
    </fieldset>
  ),
});

export const actionChangeSloppiness = register({
  name: "changeSloppiness",
  trackEvent: false,
  perform: (layers, editorState, value) => ({
      layers: changeProperty(layers, editorState, (el) =>
        newLayerWith(el, {
          seed: randomInteger(),
          roughness: value,
        }),
      ),
      editorState: { ...editorState, currentItemRoughness: value },
      commitToHistory: true,
    }),
  PanelComponent: ({ layers, editorState, updateData }) => (
    <fieldset>
      <legend>{t("labels.sloppiness")}</legend>
      <ButtonIconSelect
        group="sloppiness"
        onChange={(value) => updateData(value)}
        options={[
          {
            value: 0,
            text: t("labels.architect"),
            icon: SloppinessArchitectIcon,
          },
          {
            value: 1,
            text: t("labels.artist"),
            icon: SloppinessArtistIcon,
          },
          {
            value: 2,
            text: t("labels.cartoonist"),
            icon: SloppinessCartoonistIcon,
          },
        ]}
        value={getFormValue(
          layers,
          editorState,
          (layer) => layer.roughness,
          editorState.currentItemRoughness,
        )}
      />
    </fieldset>
  ),
});

export const actionChangeStrokeStyle = register({
  name: "changeStrokeStyle",
  trackEvent: false,
  perform: (layers, editorState, value) => ({
      layers: changeProperty(layers, editorState, (el) =>
        newLayerWith(el, {
          strokeStyle: value,
        }),
      ),
      editorState: { ...editorState, currentItemStrokeStyle: value },
      commitToHistory: true,
    }),
  PanelComponent: ({ layers, editorState, updateData }) => (
    <fieldset>
      <legend>{t("labels.strokeStyle")}</legend>
      <ButtonIconSelect
        group="strokeStyle"
        onChange={(value) => updateData(value)}
        options={[
          {
            value: "solid",
            text: t("labels.strokeStyle_solid"),
            icon: StrokeWidthBaseIcon,
          },
          {
            value: "dashed",
            text: t("labels.strokeStyle_dashed"),
            icon: StrokeStyleDashedIcon,
          },
          {
            value: "dotted",
            text: t("labels.strokeStyle_dotted"),
            icon: StrokeStyleDottedIcon,
          },
        ]}
        value={getFormValue(
          layers,
          editorState,
          (layer) => layer.strokeStyle,
          editorState.currentItemStrokeStyle,
        )}
      />
    </fieldset>
  ),
});

export const actionChangeOpacity = register({
  name: "changeOpacity",
  trackEvent: false,
  perform: (layers, editorState, value) => ({
      layers: changeProperty(
        layers,
        editorState,
        (el) =>
          newLayerWith(el, {
            opacity: value,
          }),
        true,
      ),
      editorState: { ...editorState, currentItemOpacity: value },
      commitToHistory: true,
    }),
  PanelComponent: ({ layers, editorState, updateData }) => (
    <label className="control-label">
      {t("labels.opacity")}
      <input
        max="100"
        min="0"
        onChange={(event) => updateData(+event.target.value)}
        step="10"
        type="range"
        value={
          getFormValue(
            layers,
            editorState,
            (layer) => layer.opacity,
            editorState.currentItemOpacity,
          ) ?? undefined
        }
      />
    </label>
  ),
});

export const actionChangeFontSize = register({
  name: "changeFontSize",
  trackEvent: false,
  perform: (layers, editorState, value) => changeFontSize(layers, editorState, () => value, value),
  PanelComponent: ({ layers, editorState, updateData }) => (
    <fieldset>
      <legend>{t("labels.fontSize")}</legend>
      <ButtonIconSelect
        group="font-size"
        onChange={(value) => updateData(value)}
        options={[
          {
            value: 16,
            text: t("labels.small"),
            icon: FontSizeSmallIcon,
            testId: "fontSize-small",
          },
          {
            value: 20,
            text: t("labels.medium"),
            icon: FontSizeMediumIcon,
            testId: "fontSize-medium",
          },
          {
            value: 28,
            text: t("labels.large"),
            icon: FontSizeLargeIcon,
            testId: "fontSize-large",
          },
          {
            value: 36,
            text: t("labels.veryLarge"),
            icon: FontSizeExtraLargeIcon,
            testId: "fontSize-veryLarge",
          },
        ]}
        value={getFormValue(
          layers,
          editorState,
          (layer) => {
            if (isTextLayer(layer)) {
              return layer.fontSize;
            }
            const boundTextLayer = getBoundTextLayer(layer);
            if (boundTextLayer) {
              return boundTextLayer.fontSize;
            }
            return null;
          },
          editorState.currentItemFontSize || DEFAULT_FONT_SIZE,
        )}
      />
    </fieldset>
  ),
});

export const actionDecreaseFontSize = register({
  name: "decreaseFontSize",
  trackEvent: false,
  perform: (layers, editorState, value) => changeFontSize(layers, editorState, (layer) =>
      Math.round(
        // get previous value before relative increase (doesn't work fully
        // due to rounding and float precision issues)
        (1 / (1 + FONT_SIZE_RELATIVE_INCREASE_STEP)) * layer.fontSize,
      ),
    ),
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] &&
      event.shiftKey &&
      // KEYS.COMMA needed for MacOS
      (event.key === KEYS.CHEVRON_LEFT || event.key === KEYS.COMMA),
});

export const actionIncreaseFontSize = register({
  name: "increaseFontSize",
  trackEvent: false,
  perform: (layers, editorState, value) => changeFontSize(layers, editorState, (layer) =>
      Math.round(layer.fontSize * (1 + FONT_SIZE_RELATIVE_INCREASE_STEP)),
    ),
  keyTest: (event) => event[KEYS.CTRL_OR_CMD] &&
      event.shiftKey &&
      // KEYS.PERIOD needed for MacOS
      (event.key === KEYS.CHEVRON_RIGHT || event.key === KEYS.PERIOD),
});

export const actionChangeFontFamily = register({
  name: "changeFontFamily",
  trackEvent: false,
  perform: (layers, editorState, value) => ({
      layers: changeProperty(
        layers,
        editorState,
        (oldLayer) => {
          if (isTextLayer(oldLayer)) {
            const newLayer: ExcalidrawTextLayer = newLayerWith(
              oldLayer,
              {
                fontFamily: value,
                lineHeight: getDefaultLineHeight(value),
              },
            );
            redrawTextBoundingBox(newLayer, getContainerLayer(oldLayer));
            return newLayer;
          }

          return oldLayer;
        },
        true,
      ),
      editorState: {
        ...editorState,
        currentItemFontFamily: value,
      },
      commitToHistory: true,
    }),
  PanelComponent: ({ layers, editorState, updateData }) => {
    const options: {
      icon: JSX.Layer;
      text: string;
      value: FontFamilyValues;
    }[] = [
      {
        value: FONT_FAMILY.Virgil,
        text: t("labels.handDrawn"),
        icon: FreedrawIcon,
      },
      {
        value: FONT_FAMILY.Helvetica,
        text: t("labels.normal"),
        icon: FontFamilyNormalIcon,
      },
      {
        value: FONT_FAMILY.Cascadia,
        text: t("labels.code"),
        icon: FontFamilyCodeIcon,
      },
    ];

    return (
      <fieldset>
        <legend>{t("labels.fontFamily")}</legend>
        <ButtonIconSelect<FontFamilyValues | false>
          group="font-family"
          onChange={(value) => updateData(value)}
          options={options}
          value={getFormValue(
            layers,
            editorState,
            (layer) => {
              if (isTextLayer(layer)) {
                return layer.fontFamily;
              }
              const boundTextLayer = getBoundTextLayer(layer);
              if (boundTextLayer) {
                return boundTextLayer.fontFamily;
              }
              return null;
            },
            editorState.currentItemFontFamily || DEFAULT_FONT_FAMILY,
          )}
        />
      </fieldset>
    );
  },
});

export const actionChangeTextAlign = register({
  name: "changeTextAlign",
  trackEvent: false,
  perform: (layers, editorState, value) => ({
      layers: changeProperty(
        layers,
        editorState,
        (oldLayer) => {
          if (isTextLayer(oldLayer)) {
            const newLayer: ExcalidrawTextLayer = newLayerWith(
              oldLayer,
              { textAlign: value },
            );
            redrawTextBoundingBox(newLayer, getContainerLayer(oldLayer));
            return newLayer;
          }

          return oldLayer;
        },
        true,
      ),
      editorState: {
        ...editorState,
        currentItemTextAlign: value,
      },
      commitToHistory: true,
    }),
  PanelComponent: ({ layers, editorState, updateData }) => <fieldset>
        <legend>{t("labels.textAlign")}</legend>
        <ButtonIconSelect<TextAlign | false>
          group="text-align"
          options={[
            {
              value: "left",
              text: t("labels.left"),
              icon: TextAlignLeftIcon,
              testId: "align-left",
            },
            {
              value: "center",
              text: t("labels.center"),
              icon: TextAlignCenterIcon,
              testId: "align-horizontal-center",
            },
            {
              value: "right",
              text: t("labels.right"),
              icon: TextAlignRightIcon,
              testId: "align-right",
            },
          ]}
          value={getFormValue(
            layers,
            editorState,
            (layer) => {
              if (isTextLayer(layer)) {
                return layer.textAlign;
              }
              const boundTextLayer = getBoundTextLayer(layer);
              if (boundTextLayer) {
                return boundTextLayer.textAlign;
              }
              return null;
            },
            editorState.currentItemTextAlign,
          )}
          onChange={(value) => updateData(value)}
        />
      </fieldset>,
});

export const actionChangeVerticalAlign = register({
  name: "changeVerticalAlign",
  trackEvent: { category: "layer" },
  perform: (layers, editorState, value) => ({
      layers: changeProperty(
        layers,
        editorState,
        (oldLayer) => {
          if (isTextLayer(oldLayer)) {
            const newLayer: ExcalidrawTextLayer = newLayerWith(
              oldLayer,
              { verticalAlign: value },
            );

            redrawTextBoundingBox(newLayer, getContainerLayer(oldLayer));
            return newLayer;
          }

          return oldLayer;
        },
        true,
      ),
      editorState: {
        ...editorState,
      },
      commitToHistory: true,
    }),
  PanelComponent: ({ layers, editorState, updateData }) => <fieldset>
        <ButtonIconSelect<VerticalAlign | false>
          group="text-align"
          options={[
            {
              value: VERTICAL_ALIGN.TOP,
              text: t("labels.alignTop"),
              icon: <TextAlignTopIcon theme={editorState.theme} />,
              testId: "align-top",
            },
            {
              value: VERTICAL_ALIGN.MIDDLE,
              text: t("labels.centerVertically"),
              icon: <TextAlignMiddleIcon theme={editorState.theme} />,
              testId: "align-middle",
            },
            {
              value: VERTICAL_ALIGN.BOTTOM,
              text: t("labels.alignBottom"),
              icon: <TextAlignBottomIcon theme={editorState.theme} />,
              testId: "align-bottom",
            },
          ]}
          value={getFormValue(
            layers,
            editorState,
            (layer) => {
              if (isTextLayer(layer) && layer.containerId) {
                return layer.verticalAlign;
              }
              const boundTextLayer = getBoundTextLayer(layer);
              if (boundTextLayer) {
                return boundTextLayer.verticalAlign;
              }
              return null;
            },
            VERTICAL_ALIGN.MIDDLE,
          )}
          onChange={(value) => updateData(value)}
        />
      </fieldset>,
});

export const actionChangeRoundness = register({
  name: "changeRoundness",
  trackEvent: false,
  perform: (layers, editorState, value) => ({
      layers: changeProperty(layers, editorState, (el) =>
        newLayerWith(el, {
          roundness:
            value === "round"
              ? {
                  type: isUsingAdaptiveRadius(el.type)
                    ? ROUNDNESS.ADAPTIVE_RADIUS
                    : ROUNDNESS.PROPORTIONAL_RADIUS,
                }
              : null,
        }),
      ),
      editorState: {
        ...editorState,
        currentItemRoundness: value,
      },
      commitToHistory: true,
    }),
  PanelComponent: ({ layers, editorState, updateData }) => {
    const targetLayers = getTargetLayers(
      getNonDeletedLayers(layers),
      editorState,
    );

    const hasLegacyRoundness = targetLayers.some(
      (el) => el.roundness?.type === ROUNDNESS.LEGACY,
    );

    return (
      <fieldset>
        <legend>{t("labels.edges")}</legend>
        <ButtonIconSelect
          group="edges"
          onChange={(value) => updateData(value)}
          options={[
            {
              value: "sharp",
              text: t("labels.sharp"),
              icon: EdgeSharpIcon,
            },
            {
              value: "round",
              text: t("labels.round"),
              icon: EdgeRoundIcon,
            },
          ]}
          value={getFormValue(
            layers,
            editorState,
            (layer) =>
              hasLegacyRoundness ? null : layer.roundness ? "round" : "sharp",
            (canChangeRoundness(editorState.activeTool.type) &&
              editorState.currentItemRoundness) ||
              null,
          )}
        />
      </fieldset>
    );
  },
});

export const actionChangeArrowhead = register({
  name: "changeArrowhead",
  trackEvent: false,
  perform: (layers, editorState, value: { position: "start" | "end"; type: Arrowhead }) => ({
      layers: changeProperty(layers, editorState, (el) => {
        if (isLinearLayer(el)) {
          const { position, type } = value;

          if (position === "start") {
            const layer: ExcalidrawLinearLayer = newLayerWith(el, {
              startArrowhead: type,
            });
            return layer;
          } else if (position === "end") {
            const layer: ExcalidrawLinearLayer = newLayerWith(el, {
              endArrowhead: type,
            });
            return layer;
          }
        }

        return el;
      }),
      editorState: {
        ...editorState,
        [value.position === "start"
          ? "currentItemStartArrowhead"
          : "currentItemEndArrowhead"]: value.type,
      },
      commitToHistory: true,
    }),
  PanelComponent: ({ layers, editorState, updateData }) => {
    const isRTL = getLanguage().rtl;

    return (
      <fieldset>
        <legend>{t("labels.arrowheads")}</legend>
        <div className="iconSelectList buttonList">
          <IconPicker
            label="arrowhead_start"
            onChange={(value) => updateData({ position: "start", type: value })}
            options={[
              {
                value: null,
                text: t("labels.arrowhead_none"),
                icon: ArrowheadNoneIcon,
                keyBinding: "q",
              },
              {
                value: "arrow",
                text: t("labels.arrowhead_arrow"),
                icon: <ArrowheadArrowIcon flip={!isRTL} />,
                keyBinding: "w",
              },
              {
                value: "bar",
                text: t("labels.arrowhead_bar"),
                icon: <ArrowheadBarIcon flip={!isRTL} />,
                keyBinding: "e",
              },
              {
                value: "dot",
                text: t("labels.arrowhead_dot"),
                icon: <ArrowheadDotIcon flip={!isRTL} />,
                keyBinding: "r",
              },
              {
                value: "triangle",
                text: t("labels.arrowhead_triangle"),
                icon: <ArrowheadTriangleIcon flip={!isRTL} />,
                keyBinding: "t",
              },
            ]}
            value={getFormValue<Arrowhead | null>(
              layers,
              editorState,
              (layer) =>
                isLinearLayer(layer) && canHaveArrowheads(layer.type)
                  ? layer.startArrowhead
                  : editorState.currentItemStartArrowhead,
              editorState.currentItemStartArrowhead,
            )}
          />
          <IconPicker
            group="arrowheads"
            label="arrowhead_end"
            onChange={(value) => updateData({ position: "end", type: value })}
            options={[
              {
                value: null,
                text: t("labels.arrowhead_none"),
                keyBinding: "q",
                icon: ArrowheadNoneIcon,
              },
              {
                value: "arrow",
                text: t("labels.arrowhead_arrow"),
                keyBinding: "w",
                icon: <ArrowheadArrowIcon flip={isRTL} />,
              },
              {
                value: "bar",
                text: t("labels.arrowhead_bar"),
                keyBinding: "e",
                icon: <ArrowheadBarIcon flip={isRTL} />,
              },
              {
                value: "dot",
                text: t("labels.arrowhead_dot"),
                keyBinding: "r",
                icon: <ArrowheadDotIcon flip={isRTL} />,
              },
              {
                value: "triangle",
                text: t("labels.arrowhead_triangle"),
                icon: <ArrowheadTriangleIcon flip={isRTL} />,
                keyBinding: "t",
              },
            ]}
            value={getFormValue<Arrowhead | null>(
              layers,
              editorState,
              (layer) =>
                isLinearLayer(layer) && canHaveArrowheads(layer.type)
                  ? layer.endArrowhead
                  : editorState.currentItemEndArrowhead,
              editorState.currentItemEndArrowhead,
            )}
          />
        </div>
      </fieldset>
    );
  },
});
