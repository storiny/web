import { useEffect, useState } from "react";

import { copyTextToSystemClipboard } from "../clipboard";
import { DEFAULT_VERSION } from "../constants";
import { t } from "../i18n";
import { NonDeletedExcalidrawLayer } from "../layer/types";
import { UIAppState } from "../types";
import { debounce, getVersion, nFormatter } from "../utils";
import { getLayersStorageSize, getTotalStorageSize } from "./data/localStorage";

type StorageSizes = { scene: number; total: number };

const STORAGE_SIZE_TIMEOUT = 500;

const getStorageSizes = debounce((cb: (sizes: StorageSizes) => void) => {
  cb({
    scene: getLayersStorageSize(),
    total: getTotalStorageSize()
  });
}, STORAGE_SIZE_TIMEOUT);

type Props = {
  appState: UIAppState;
  layers: readonly NonDeletedExcalidrawLayer[];
  setToast: (message: string) => void;
};
const CustomStats = (props: Props) => {
  const [storageSizes, setStorageSizes] = useState<StorageSizes>({
    scene: 0,
    total: 0
  });

  useEffect(() => {
    getStorageSizes((sizes) => {
      setStorageSizes(sizes);
    });
  }, [props.layers, props.appState]);
  useEffect(() => () => getStorageSizes.cancel(), []);

  const version = getVersion();
  let hash;
  let timestamp;

  if (version !== DEFAULT_VERSION) {
    timestamp = version.slice(0, 16).replace("T", " ");
    hash = version.slice(21);
  } else {
    timestamp = t("stats.versionNotAvailable");
  }

  return (
    <>
      <tr>
        <th colSpan={2}>{t("stats.storage")}</th>
      </tr>
      <tr>
        <td>{t("stats.scene")}</td>
        <td>{nFormatter(storageSizes.scene, 1)}</td>
      </tr>
      <tr>
        <td>{t("stats.total")}</td>
        <td>{nFormatter(storageSizes.total, 1)}</td>
      </tr>
      <tr>
        <th colSpan={2}>{t("stats.version")}</th>
      </tr>
      <tr>
        <td
          colSpan={2}
          onClick={async () => {
            try {
              await copyTextToSystemClipboard(getVersion());
              props.setToast(t("toast.copyToClipboard"));
            } catch {}
          }}
          style={{ textAlign: "center", cursor: "pointer" }}
          title={t("stats.versionCopy")}
        >
          {timestamp}
          <br />
          {hash}
        </td>
      </tr>
    </>
  );
};

export default CustomStats;
