"use client";

import { Item as Option } from "@radix-ui/react-select";
import clsx from "clsx";
import { useAtom } from "jotai";
import React from "react";

import Select from "~/components/Select";
import { capitalize } from "~/utils/capitalize";

import { skinToneAtom } from "../../atoms";
import { SkinTone as SkinToneEnum } from "../../constants";
import styles from "./SkinTone.module.scss";

const skinToneColorMap: Record<SkinToneEnum, string> = {
  [SkinToneEnum.DARK /*        */]: "#60463A",
  [SkinToneEnum.LIGHT /*       */]: "#FFDFBD",
  [SkinToneEnum.MEDIUM /*      */]: "#C88E62",
  [SkinToneEnum.MEDIUM_LIGHT /**/]: "#E9C197",
  [SkinToneEnum.MEDIUM_DARK /* */]: "#A86637",
  [SkinToneEnum.DEFAULT /*     */]: "#FFD225"
};

const SkinTone = (): React.ReactElement => {
  const [value, setValue] = useAtom(skinToneAtom);
  return (
    <Select
      onValueChange={(newValue): void =>
        setValue((prev) => ({
          ...prev,
          active: newValue as SkinToneEnum
        }))
      }
      slotProps={{
        content: {
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
      valueChildren={
        <span
          className={styles.option}
          style={
            {
              "--tone": skinToneColorMap[value.active],
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
            setValue((prev) => ({ ...prev, hover: tone }))
          }
          onMouseLeave={(): void =>
            setValue((prev) => ({ ...prev, hover: null }))
          }
          style={{ "--tone": skinToneColorMap[tone] } as React.CSSProperties}
          title={`${capitalize(tone.replace(/-/g, " "))} tone`}
          value={tone}
        />
      ))}
    </Select>
  );
};

export default SkinTone;
