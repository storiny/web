"use client";

import { USER_PROPS } from "@storiny/shared";
import { is_test_env } from "@storiny/shared/src/utils/is-test-env";
import clsx from "clsx";
import React from "react";
import type { ZXCVBNScore } from "zxcvbn";

import FormInput from "~/components/form-input";
import IconButton from "~/components/icon-button";
import Spinner from "~/components/spinner";
import EyeIcon from "~/icons/eye";
import EyeClosedIcon from "~/icons/eye-closed";
import LockIcon from "~/icons/lock";
import css from "~/theme/main.module.scss";
import { scale_number } from "~/utils/scale-number";

import { use_form_context } from "../form";
import styles from "./form-new-password-input.module.scss";
import { FormNewPasswordInputProps } from "./form-new-password-input.props";

const SCORE_COLOR_MAP: Record<ZXCVBNScore, string> = {
  0: "var(--ruby-500)",
  1: "var(--ruby-500)",
  2: "var(--lemon-500)",
  3: "var(--lemon-500)",
  4: "var(--melon-100)"
};

const SPINNER_SIZE_MAP: Record<
  NonNullable<FormNewPasswordInputProps["size"]>,
  string
> = {
  sm: "",
  md: "24px",
  lg: "28px"
};

// Strength indicator

const StrengthIndicator = ({
  score: score_prop,
  size
}: {
  score: ZXCVBNScore;
  size: NonNullable<FormNewPasswordInputProps["size"]>;
}): React.ReactElement => {
  const scale = scale_number(0, 4, 0, 100);
  const score = React.useMemo(() => scale(score_prop), [scale, score_prop]);
  return (
    <span
      className={clsx(
        css["flex-center"],
        styles["strength-indicator"],
        styles[size]
      )}
      role={"presentation"}
    >
      <Spinner
        aria-valuemax={undefined}
        aria-valuemin={undefined}
        aria-valuenow={undefined}
        aria-valuetext={undefined}
        as={"span"}
        className={styles["strength-ring"]}
        role={undefined}
        slot_props={{
          progress: {
            className: styles["strength-progress"],
            style: {
              "--progress-bg": SCORE_COLOR_MAP[score_prop]
            } as React.CSSProperties
          }
        }}
        style={{ "--size": SPINNER_SIZE_MAP[size] } as React.CSSProperties}
        value={score}
      >
        <LockIcon className={styles["strength-icon"]} />
      </Spinner>
    </span>
  );
};

// Main component

const FormNewPasswordInput = React.forwardRef<
  HTMLFieldSetElement,
  FormNewPasswordInputProps
>((props, ref) => {
  const {
    name,
    label,
    size = "md",
    defaultValue = "",
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    onInput,
    ...rest
  } = props;
  const mount_synced = React.useRef<boolean>(false);
  const [visible, set_visible] = React.useState<boolean>(false);
  const [value, set_value] = React.useState<typeof defaultValue>(defaultValue);
  const [suggestion, set_suggestion] = React.useState<string>("");
  const [score, set_score] = React.useState<ZXCVBNScore>(0);
  const {
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    formState: { defaultValues }
  } = use_form_context();

  const toggle_visibility = (): void => {
    set_visible((prev_state) => !prev_state);
  };

  /**
   * Computes the password strength score
   */
  const compute_password_strength = React.useCallback(
    async (password: string) => {
      if (!is_test_env()) {
        // Lazily load zxcvbn
        const zxcvbn = (await import("zxcvbn")).default;
        const results = zxcvbn(password);

        if (results.feedback.suggestions.length) {
          set_suggestion(results.feedback.suggestions[0]);
        } else {
          set_suggestion("");
        }

        // Scale the score
        set_score(results.score);
      }
    },
    []
  );

  /**
   * Handles password input value
   */
  const handle_input = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const next_value = event.target.value;
      onInput?.(event);
      set_value(next_value);

      await compute_password_strength(next_value);
    },
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    [compute_password_strength, onInput]
  );

  // Compute score if initial value is not an empty string
  React.useEffect(() => {
    if (defaultValues?.[name] && !mount_synced.current) {
      mount_synced.current = true;

      compute_password_strength(defaultValues[name]).then(() => undefined);
    }
  }, [compute_password_strength, defaultValues, name]);

  return (
    <FormInput
      {...rest}
      autoComplete={"new-password"}
      decorator={<StrengthIndicator score={score} size={size} />}
      defaultValue={undefined}
      end_decorator={
        <IconButton
          aria-label={`${visible ? "Hide" : "Show"} password`}
          onClick={toggle_visibility}
          title={`${visible ? "Hide" : "Show"} password`}
        >
          {visible ? <EyeClosedIcon /> : <EyeIcon />}
        </IconButton>
      }
      helper_text={suggestion ? suggestion : undefined}
      label={label}
      maxLength={USER_PROPS.password.max_length}
      minLength={USER_PROPS.password.min_length}
      name={name}
      onInput={handle_input}
      ref={ref}
      size={size}
      type={visible ? "text" : "password"}
      value={value}
    />
  );
});

FormNewPasswordInput.displayName = "FormNewPasswordInput";

export default FormNewPasswordInput;
