import "./PasteChartDialog.scss";

import oc from "open-color";
import React, { useLayoutEffect, useRef, useState } from "react";

import { UIAppState } from "../../core/types";
import {
  ChartLayers,
  renderSpreadsheet,
  Spreadsheet
} from "../../lib/chart/charts";
import { exportToSvg } from "../../lib/scene/export/export";
import { trackEvent } from "../analytics";
import { t } from "../i18n";
import { ChartType } from "../layer/types";
import { useApp } from "./App";
import { Dialog } from "./Dialog";

type OnInsertChart = (chartType: ChartType, layers: ChartLayers) => void;

const ChartPreviewBtn = (props: {
  chartType: ChartType;
  onClick: OnInsertChart;
  selected: boolean;
  spreadsheet: Spreadsheet | null;
}) => {
  const previewRef = useRef<HTMLDivLayer | null>(null);
  const [chartLayers, setChartLayers] = useState<ChartLayers | null>(null);

  useLayoutEffect(() => {
    if (!props.spreadsheet) {
      return;
    }

    const layers = renderSpreadsheet(props.chartType, props.spreadsheet, 0, 0);
    setChartLayers(layers);
    let svg: SVGSVGLayer;
    const previewNode = previewRef.current!;

    (async () => {
      svg = await exportToSvg(
        layers,
        {
          exportBackground: false,
          viewBackgroundColor: oc.white
        },
        null // files
      );
      svg.querySelector(".style-fonts")?.remove();
      previewNode.replaceChildren();
      previewNode.appendChild(svg);

      if (props.selected) {
        (previewNode.parentNode as HTMLDivLayer).focus();
      }
    })();

    return () => {
      previewNode.replaceChildren();
    };
  }, [props.spreadsheet, props.chartType, props.selected]);

  return (
    <button
      className="ChartPreview"
      onClick={() => {
        if (chartLayers) {
          props.onClick(props.chartType, chartLayers);
        }
      }}
    >
      <div ref={previewRef} />
    </button>
  );
};

export const PasteChartDialog = ({
  setAppState,
  editorState,
  onClose
}: {
  editorState: UIAppState;
  onClose: () => void;
  setAppState: React.Component<any, UIAppState>["setState"];
}) => {
  const { onInsertLayers } = useApp();
  const handleClose = React.useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  const handleChartClick = (chartType: ChartType, layers: ChartLayers) => {
    onInsertLayers(layers);
    trackEvent("magic", "chart", chartType);
    setAppState({
      currentChartType: chartType,
      pasteDialog: {
        shown: false,
        data: null
      }
    });
  };

  return (
    <Dialog
      autofocus={false}
      className={"PasteChartDialog"}
      onCloseRequest={handleClose}
      size="small"
      title={t("labels.pasteCharts")}
    >
      <div className={"container"}>
        <ChartPreviewBtn
          chartType="bar"
          onClick={handleChartClick}
          selected={editorState.currentChartType === "bar"}
          spreadsheet={editorState.pasteDialog.data}
        />
        <ChartPreviewBtn
          chartType="line"
          onClick={handleChartClick}
          selected={editorState.currentChartType === "line"}
          spreadsheet={editorState.pasteDialog.data}
        />
      </div>
    </Dialog>
  );
};
