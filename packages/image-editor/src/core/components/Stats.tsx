import "./Stats.scss";

import React from "react";

import { getTargetLayers } from "../../lib/scene";
import { t } from "../i18n";
import { getCommonBounds } from "../layer/bounds";
import { NonDeletedExcalidrawLayer } from "../layer/types";
import { ExcalidrawProps, UIAppState } from "../types";
import { CloseIcon } from "./icons";
import { Island } from "./Island";

export const Stats = (props: {
  editorState: UIAppState;
  layers: readonly NonDeletedExcalidrawLayer[];
  onClose: () => void;
  renderCustomStats: ExcalidrawProps["renderCustomStats"];
  setAppState: React.Component<any, UIAppState>["setState"];
}) => {
  const boundingBox = getCommonBounds(props.layers);
  const selectedLayers = getTargetLayers(props.layers, props.editorState);
  const selectedBoundingBox = getCommonBounds(selectedLayers);

  return (
    <div className="Stats">
      <Island padding={2}>
        <div className="close" onClick={props.onClose}>
          {CloseIcon}
        </div>
        <h3>{t("stats.title")}</h3>
        <table>
          <tbody>
            <tr>
              <th colSpan={2}>{t("stats.scene")}</th>
            </tr>
            <tr>
              <td>{t("stats.layers")}</td>
              <td>{props.layers.length}</td>
            </tr>
            <tr>
              <td>{t("stats.width")}</td>
              <td>{Math.round(boundingBox[2]) - Math.round(boundingBox[0])}</td>
            </tr>
            <tr>
              <td>{t("stats.height")}</td>
              <td>{Math.round(boundingBox[3]) - Math.round(boundingBox[1])}</td>
            </tr>

            {selectedLayers.length === 1 && (
              <tr>
                <th colSpan={2}>{t("stats.layer")}</th>
              </tr>
            )}

            {selectedLayers.length > 1 && (
              <>
                <tr>
                  <th colSpan={2}>{t("stats.selected")}</th>
                </tr>
                <tr>
                  <td>{t("stats.layers")}</td>
                  <td>{selectedLayers.length}</td>
                </tr>
              </>
            )}
            {selectedLayers.length > 0 && (
              <>
                <tr>
                  <td>{"x"}</td>
                  <td>{Math.round(selectedBoundingBox[0])}</td>
                </tr>
                <tr>
                  <td>{"y"}</td>
                  <td>{Math.round(selectedBoundingBox[1])}</td>
                </tr>
                <tr>
                  <td>{t("stats.width")}</td>
                  <td>
                    {Math.round(
                      selectedBoundingBox[2] - selectedBoundingBox[0]
                    )}
                  </td>
                </tr>
                <tr>
                  <td>{t("stats.height")}</td>
                  <td>
                    {Math.round(
                      selectedBoundingBox[3] - selectedBoundingBox[1]
                    )}
                  </td>
                </tr>
              </>
            )}
            {selectedLayers.length === 1 && (
              <tr>
                <td>{t("stats.angle")}</td>
                <td>
                  {`${Math.round((selectedLayers[0].angle * 180) / Math.PI)}°`}
                </td>
              </tr>
            )}
            {props.renderCustomStats?.(props.layers, props.editorState)}
          </tbody>
        </table>
      </Island>
    </div>
  );
};
