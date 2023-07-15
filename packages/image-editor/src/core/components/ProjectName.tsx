import "./TextInput.scss";
import "./ProjectName.scss";

import React, { useState } from "react";

import { KEYS } from "../keys";
import { focusNearestParent } from "../utils";
import { useExcalidrawContainer } from "./App";

type Props = {
  ignoreFocus?: boolean;
  isNameEditable: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
};

export const ProjectName = (props: Props) => {
  const { id } = useExcalidrawContainer();
  const [fileName, setFileName] = useState<string>(props.value);

  const handleBlur = (event: any) => {
    if (!props.ignoreFocus) {
      focusNearestParent(event.target);
    }
    const value = event.target.value;
    if (value !== props.value) {
      props.onChange(value);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLLayer>) => {
    if (event.key === KEYS.ENTER) {
      event.preventDefault();
      if (event.nativeEvent.isComposing || event.keyCode === 229) {
        return;
      }
      event.currentTarget.blur();
    }
  };

  return (
    <div className="ProjectName">
      <label className="ProjectName-label" htmlFor="filename">
        {`${props.label}${props.isNameEditable ? "" : ":"}`}
      </label>
      {props.isNameEditable ? (
        <input
          className="TextInput"
          id={`${id}-filename`}
          onBlur={handleBlur}
          onChange={(event) => setFileName(event.target.value)}
          onKeyDown={handleKeyDown}
          type="text"
          value={fileName}
        />
      ) : (
        <span className="TextInput TextInput--readonly" id={`${id}-filename`}>
          {props.value}
        </span>
      )}
    </div>
  );
};
