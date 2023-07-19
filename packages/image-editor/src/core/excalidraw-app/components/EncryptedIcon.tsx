import { shield } from "../../../components/core/icons";
import { Tooltip } from "../../../components/core/Tooltip";
import { useI18n } from "../../i18n";

export const EncryptedIcon = () => {
  const { t } = useI18n();

  return (
    <a
      aria-label={t("encrypted.link")}
      className="encrypted-icon tooltip"
      href="https://blog.excalidraw.com/end-to-end-encryption/"
      rel="noopener noreferrer"
      target="_blank"
    >
      <Tooltip label={t("encrypted.tooltip")} long={true}>
        {shield}
      </Tooltip>
    </a>
  );
};
