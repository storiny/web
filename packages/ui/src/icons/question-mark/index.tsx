"use client";

import React from "react";

import { create_svg_icon } from "~/utils/create-svg-icon";

const QuestionMarkIcon = (
  <path d="M4 4c0-.39782.18437-.77936.51256-1.06066C4.84075 2.65804 5.28587 2.5 5.75 2.5h.5c.46413 0 .90925.15804 1.23744.43934C7.81563 3.22064 8 3.60218 8 4a1.50001 1.50001 0 0 1-1 1.5c-.30674.14382-.57012.41663-.75048.77735C6.06916 6.63807 5.98159 7.06716 6 7.5m0 2v.005" />
);

export default create_svg_icon(QuestionMarkIcon, "question-mark");
