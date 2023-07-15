import React, { useEffect, useState } from "react";

import { defaultLang, Language, languages, setLanguage } from "../i18n";
import { Theme } from "../layer/types";
import { LoadingMessage } from "./LoadingMessage";

interface Props {
  children: React.ReactLayer;
  langCode: Language["code"];
  theme?: Theme;
}

export const InitializeApp = (props: Props) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateLang = async () => {
      await setLanguage(currentLang);
      setLoading(false);
    };
    const currentLang =
      languages.find((lang) => lang.code === props.langCode) || defaultLang;
    updateLang();
  }, [props.langCode]);

  return loading ? <LoadingMessage theme={props.theme} /> : props.children;
};
