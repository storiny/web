"use client";

import React from "react";

import { capitalize } from "~/utils/capitalize";

const APP_STATUS = process.env.NEXT_PUBLIC_APP_STATUS;
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;
const APP_BUILD_HASH = process.env.NEXT_PUBLIC_BUILD_HASH;

const SelfXSSWarning = (): null => {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    const primary_message = [
      `%cStoriny — ${capitalize(APP_STATUS || "")} ${APP_VERSION || ""} (${
        APP_BUILD_HASH || "-"
      })`,
      `
background: #000;
color: #fff;
padding: 4px 0.75em;
border-radius: 0.45em;
font-family: monospace;
font-size: 12px;
`
    ];

    const warning_message = [
      `%cWarning: Pasting anything here can be dangerous. While your session is \
secure, attackers may trick you into running harmful code. If some shady \
character told you to copy-paste something here for a so-called "hidden feature" \
or to "hack" someone's account, you're simply being scammed.`,
      `
background: #fbfbfb;
color: #000;
padding: 12px;
border-radius: 0.25em;
border: 1px solid #f00;
font-family: monospace;
font-size: 12px;
line-height: 18px;
`
    ];

    console.log(...primary_message);
    console.log(...warning_message);
  }, []);

  return null;
};

export default SelfXSSWarning;
