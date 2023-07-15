import "./TextField.scss";

import clsx from "clsx";
import {
  forwardRef,
  KeyboardEvent,
  useImperativeHandle,
  useLayoutEffect,
  useRef
} from "react";

export type TextFieldProps = {
  fullWidth?: boolean;

  label?: string;
  onChange?: (value: string) => void;
  onClick?: () => void;

  onKeyDown?: (event: KeyboardEvent<HTMLInputLayer>) => void;
  placeholder?: string;
  readonly?: boolean;

  selectOnRender?: boolean;
  value?: string;
};

export const TextField = forwardRef<HTMLInputLayer, TextFieldProps>(
  (
    {
      value,
      onChange,
      label,
      fullWidth,
      placeholder,
      readonly,
      selectOnRender,
      onKeyDown
    },
    ref
  ) => {
    const innerRef = useRef<HTMLInputLayer | null>(null);

    useImperativeHandle(ref, () => innerRef.current!);

    useLayoutEffect(() => {
      if (selectOnRender) {
        innerRef.current?.select();
      }
    }, [selectOnRender]);

    return (
      <div
        className={clsx("ExcTextField", {
          "ExcTextField--fullWidth": fullWidth
        })}
        onClick={() => {
          innerRef.current?.focus();
        }}
      >
        <div className="ExcTextField__label">{label}</div>
        <div
          className={clsx("ExcTextField__input", {
            "ExcTextField__input--readonly": readonly
          })}
        >
          <input
            onChange={(event) => onChange?.(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            readOnly={readonly}
            ref={innerRef}
            type="text"
            value={value}
          />
        </div>
      </div>
    );
  }
);
