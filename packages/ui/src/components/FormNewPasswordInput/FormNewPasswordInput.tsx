"use client";

import { userProps } from "@storiny/shared";
import { isTestEnv } from "@storiny/shared/src/utils/isTestEnv";
import clsx from "clsx";
import React from "react";
import { useFormContext } from "react-hook-form";
import { ZXCVBNScore } from "zxcvbn";

import FormInput from "~/components/FormInput";
import IconButton from "~/components/IconButton";
import Spinner from "~/components/Spinner";
import EyeIcon from "~/icons/Eye";
import EyeClosedIcon from "~/icons/EyeClosed";
import LockIcon from "~/icons/Lock";
import { scaleNumber } from "~/utils/scaleNumber";

import styles from "./FormNewPasswordInput.module.scss";
import { FormNewPasswordInputProps } from "./FormNewPasswordInput.props";

const scoreToColorMap: Record<ZXCVBNScore, string> = {
  0: "var(--ruby-500)",
  1: "var(--ruby-500)",
  2: "var(--lemon-500)",
  3: "var(--lemon-500)",
  4: "var(--melon-100)"
};

const spinnerSizeMap: Record<
  NonNullable<FormNewPasswordInputProps["size"]>,
  string
> = {
  sm: "",
  md: "24px",
  lg: "28px"
};

// Strength indicator

const StrengthIndicator = ({
  score: scoreProp,
  size
}: {
  score: ZXCVBNScore;
  size: NonNullable<FormNewPasswordInputProps["size"]>;
}): React.ReactElement => {
  const scale = scaleNumber(0, 4, 0, 100);
  const score = React.useMemo(() => scale(scoreProp), [scale, scoreProp]);

  return (
    <span
      className={clsx(
        "flex-center",
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
              "--progress-bg": scoreToColorMap[scoreProp]
            } as React.CSSProperties
          }
        }}
        style={{ "--size": spinnerSizeMap[size] } as React.CSSProperties}
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
    onInput,
    ...rest
  } = props;
  const mountSynced = React.useRef<boolean>(false);
  const [visible, setVisible] = React.useState<boolean>(false);
  const [value, setValue] = React.useState<typeof defaultValue>(defaultValue);
  const [suggestion, setSuggestion] = React.useState<string>("");
  const [score, setScore] = React.useState<ZXCVBNScore>(0);
  const {
    formState: { defaultValues }
  } = useFormContext();

  const toggleVisibility = (): void => {
    setVisible((prevState) => !prevState);
  };

  /**
   * Computes the password strength score
   */
  const computePasswordStrength = React.useCallback(
    async (password: string) => {
      if (!isTestEnv()) {
        // Lazily load zxcvbn
        const zxcvbn = (await import("zxcvbn")).default;
        const results = zxcvbn(password);

        if (results.feedback.suggestions.length) {
          setSuggestion(results.feedback.suggestions[0]);
        } else {
          setSuggestion("");
        }

        // Scale the score
        setScore(results.score);
      }
    },
    []
  );

  /**
   * Handle password input value
   */
  const handleInput = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      onInput?.(event);
      setValue(newValue);

      await computePasswordStrength(newValue);
    },
    [computePasswordStrength, onInput]
  );

  // Compute score if initial value is not an empty string
  React.useEffect(() => {
    if (defaultValues?.[name] && !mountSynced.current) {
      mountSynced.current = true;

      computePasswordStrength(defaultValues[name]).then(() => undefined);
    }
  }, [computePasswordStrength, defaultValues, name]);

  return (
    <FormInput
      {...rest}
      autoComplete={"new-password"}
      decorator={<StrengthIndicator score={score} size={size} />}
      defaultValue={undefined}
      endDecorator={
        <IconButton
          aria-label={`${visible ? "Hide" : "Show"} password`}
          onClick={toggleVisibility}
          title={`${visible ? "Hide" : "Show"} password`}
        >
          {visible ? <EyeClosedIcon /> : <EyeIcon />}
        </IconButton>
      }
      helperText={suggestion ? suggestion : undefined}
      label={label}
      maxLength={userProps.password.maxLength}
      minLength={userProps.password.minLength}
      name={name}
      onInput={handleInput}
      ref={ref}
      size={size}
      type={visible ? "text" : "password"}
      value={value}
    />
  );
});

FormNewPasswordInput.displayName = "FormNewPasswordInput";

export default FormNewPasswordInput;
