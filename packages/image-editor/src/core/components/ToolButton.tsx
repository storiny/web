import "./ToolIcon.scss";

import clsx from "clsx";
import React, { CSSProperties, useEffect, useRef, useState } from "react";

import { AbortError } from "../errors";
import { PointerType } from "../layer/types";
import { useExcalidrawContainer } from "./App";
import Spinner from "./Spinner";

export type ToolButtonSize = "small" | "medium";

type ToolButtonBaseProps = {
  "aria-keyshortcuts"?: string;
  "aria-label": string;
  className?: string;
  "data-testid"?: string;
  hidden?: boolean;
  icon?: React.ReactNode;
  id?: string;
  isLoading?: boolean;
  keyBindingLabel?: string | null;
  label?: string;
  name?: string;
  selected?: boolean;
  showAriaLabel?: boolean;
  size?: ToolButtonSize;
  style?: CSSProperties;
  title?: string;
  visible?: boolean;
};

type ToolButtonProps =
  | (ToolButtonBaseProps & {
      children?: React.ReactNode;
      onClick?(event: React.MouseEvent): void;
      type: "button";
    })
  | (ToolButtonBaseProps & {
      children?: React.ReactNode;
      onClick?(event: React.MouseEvent): void;
      type: "submit";
    })
  | (ToolButtonBaseProps & {
      children?: React.ReactNode;
      onClick?(): void;
      type: "icon";
    })
  | (ToolButtonBaseProps & {
      checked: boolean;
      onChange?(data: { pointerType: PointerType | null }): void;
      onPointerDown?(data: { pointerType: PointerType }): void;
      type: "radio";
    });

export const ToolButton = React.forwardRef((props: ToolButtonProps, ref) => {
  const { id: excalId } = useExcalidrawContainer();
  const innerRef = React.useRef(null);
  React.useImperativeHandle(ref, () => innerRef.current);
  const sizeCn = `ToolIcon_size_${props.size}`;

  const [isLoading, setIsLoading] = useState(false);

  const isMountedRef = useRef(true);

  const onClick = async (event: React.MouseEvent) => {
    const ret = "onClick" in props && props.onClick?.(event);

    if (ret && "then" in ret) {
      try {
        setIsLoading(true);
        await ret;
      } catch (error: any) {
        if (!(error instanceof AbortError)) {
          throw error;
        } else {
          console.warn(error);
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    }
  };

  useEffect(
    () => () => {
      isMountedRef.current = false;
    },
    []
  );

  const lastPointerTypeRef = useRef<PointerType | null>(null);

  if (
    props.type === "button" ||
    props.type === "icon" ||
    props.type === "submit"
  ) {
    const type = (props.type === "icon" ? "button" : props.type) as
      | "button"
      | "submit";
    return (
      <button
        aria-label={props["aria-label"]}
        className={clsx(
          "ToolIcon_type_button",
          sizeCn,
          props.className,
          props.visible && !props.hidden
            ? "ToolIcon_type_button--show"
            : "ToolIcon_type_button--hide",
          {
            ToolIcon: !props.hidden,
            "ToolIcon--selected": props.selected,
            "ToolIcon--plain": props.type === "icon"
          }
        )}
        data-testid={props["data-testid"]}
        disabled={isLoading || props.isLoading}
        hidden={props.hidden}
        onClick={onClick}
        ref={innerRef}
        style={props.style}
        title={props.title}
        type={type}
      >
        {(props.icon || props.label) && (
          <div aria-hidden="true" className="ToolIcon__icon">
            {props.icon || props.label}
            {props.keyBindingLabel && (
              <span className="ToolIcon__keybinding">
                {props.keyBindingLabel}
              </span>
            )}
            {props.isLoading && <Spinner />}
          </div>
        )}
        {props.showAriaLabel && (
          <div className="ToolIcon__label">
            {props["aria-label"]} {isLoading && <Spinner />}
          </div>
        )}
        {props.children}
      </button>
    );
  }

  return (
    <label
      className={clsx("ToolIcon", props.className)}
      onPointerDown={(event) => {
        lastPointerTypeRef.current = event.pointerType || null;
        props.onPointerDown?.({ pointerType: event.pointerType || null });
      }}
      onPointerUp={() => {
        requestAnimationFrame(() => {
          lastPointerTypeRef.current = null;
        });
      }}
      title={props.title}
    >
      <input
        aria-keyshortcuts={props["aria-keyshortcuts"]}
        aria-label={props["aria-label"]}
        checked={props.checked}
        className={`ToolIcon_type_radio ${sizeCn}`}
        data-testid={props["data-testid"]}
        id={`${excalId}-${props.id}`}
        name={props.name}
        onChange={() => {
          props.onChange?.({ pointerType: lastPointerTypeRef.current });
        }}
        ref={innerRef}
        type="radio"
      />
      <div className="ToolIcon__icon">
        {props.icon}
        {props.keyBindingLabel && (
          <span className="ToolIcon__keybinding">{props.keyBindingLabel}</span>
        )}
      </div>
    </label>
  );
});

ToolButton.defaultProps = {
  visible: true,
  className: "",
  size: "medium"
};

ToolButton.displayName = "ToolButton";
