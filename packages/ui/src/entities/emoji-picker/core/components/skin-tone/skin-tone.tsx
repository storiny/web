"use client";

import { Item as Option } from "@radix-ui/react-select";
import clsx from "clsx";
import { useAtom as use_atom } from "jotai";
import React from "react";
import Select from "src/components/select";

import { capitalize } from "~/utils/capitalize";

import { skin_tone_atom } from "../../atoms";
import { SkinTone as SkinToneEnum } from "../../constants";
import styles from "./skin-tone.module.scss";

const SKIN_TONE_COLOR_MAP: Record<SkinToneEnum, string> = {
  [SkinToneEnum.DARK /*        */]: "#60463A",
  [SkinToneEnum.LIGHT /*       */]: "#FFDFBD",
  [SkinToneEnum.MEDIUM /*      */]: "#C88E62",
  [SkinToneEnum.MEDIUM_LIGHT /**/]: "#E9C197",
  [SkinToneEnum.MEDIUM_DARK /* */]: "#A86637",
  [SkinToneEnum.DEFAULT /*     */]: "#FFD225"
};

const SkinTone = (): React.ReactElement => {
  const [value, set_value] = use_atom(skin_tone_atom);
  return (
    <Select
      onValueChange={(newValue): void =>
        set_value((prev) => ({
          ...prev,
          active: newValue as SkinToneEnum
        }))
      }
      slot_props={{
        content: {
          // eslint-disable-next-line prefer-snakecase/prefer-snakecase
          sideOffset: 8,
          position: "popper",
          style: {
            zIndex: "calc(var(--z-index-popover) + 1)"
          }
        },
        viewport: {
          className: clsx("flex", styles.viewport)
        },
        value: { placeholder: "Skin tone" },
        trigger: {
          "aria-label": "Choose skin tone"
        }
      }}
      value={value.active}
      value_children={
        <span
          className={styles.option}
          style={
            {
              "--tone": SKIN_TONE_COLOR_MAP[value.active],
              marginLeft: "-3px"
            } as React.CSSProperties
          }
        />
      }
    >
      {[
        SkinToneEnum.DEFAULT,
        SkinToneEnum.LIGHT,
        SkinToneEnum.MEDIUM_LIGHT,
        SkinToneEnum.MEDIUM,
        SkinToneEnum.MEDIUM_DARK,
        SkinToneEnum.DARK
      ].map((tone) => (
        <Option
          aria-label={`${tone.replace(/-/g, " ")} tone`}
          aria-labelledby={undefined}
          className={styles.option}
          key={tone}
          onMouseEnter={(): void =>
            set_value((prev) => ({ ...prev, hover: tone }))
          }
          onMouseLeave={(): void =>
            set_value((prev) => ({ ...prev, hover: null }))
          }
          style={{ "--tone": SKIN_TONE_COLOR_MAP[tone] } as React.CSSProperties}
          title={`${capitalize(tone.replace(/-/g, " "))} tone`}
          value={tone}
        />
      ))}
    </Select>
  );
};

export default SkinTone;
