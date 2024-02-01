import { dev_console } from "@storiny/shared/src/utils/dev-log";
import { FabricObject } from "fabric";
import FontFaceObserver from "fontfaceobserver";
import React from "react";

import Grow from "~/components/grow";
import Input from "~/components/input";
import Option from "~/components/option";
import Select from "~/components/select";
import Spinner from "~/components/spinner";
import Toggle from "~/components/toggle";
import ToggleGroup from "~/components/toggle-group";
import ToggleGroupItem from "~/components/toggle-group-item";
import AlignCenterIcon from "~/icons/align-center";
import AlignJustifyIcon from "~/icons/align-justify";
import AlignLeftIcon from "~/icons/align-left";
import ItalicIcon from "~/icons/italic";
import LetterSpacingIcon from "~/icons/letter-spacing";
import LineHeightIcon from "~/icons/line-height";
import StrikethroughIcon from "~/icons/strikethrough";
import TextSizeIcon from "~/icons/text-size";
import UnderlineIcon from "~/icons/underline";
import css from "~/theme/main.module.scss";
import { clamp } from "~/utils/clamp";

import { use_active_object } from "../../../../../hooks";
import {
  DEFAULT_FONT_SIZE,
  DEFAULT_LETTER_SPACING,
  DEFAULT_LINE_HEIGHT
} from "../../../../../lib";
import { get_css_variable_value, modify_object } from "../../../../../utils";
import { SpacerWithDivider } from "../../draw";
import DrawItem, { DrawItemRow } from "../../item";

// Font family

const FONT_NAME_TO_FAMILY_MAP: Record<string, string> = {
  Satoshi: get_css_variable_value("--font-satoshi"),
  Virgil: get_css_variable_value("--font-virgil"),
  Monospace: "monospace"
};

/**
 * Returns the name of the font by its family.
 * @param family The font family.
 */
const get_font_name_from_family = (family: string): string | null => {
  const font_family = Object.entries(FONT_NAME_TO_FAMILY_MAP).find(
    ([, value]) => value === family
  );

  if (font_family) {
    return font_family[0];
  }

  return null;
};

const FontFamilyControl = ({
  active_object
}: {
  active_object: FabricObject;
}): React.ReactElement => {
  const mounted_ref = React.useRef<boolean>(false);
  const [loading, set_loading] = React.useState<boolean>(false);
  const [font_family, set_font_family] = React.useState<string>(
    get_font_name_from_family(active_object?.get("fontFamily")) || "Satoshi"
  );

  /**
   * Mutates the font family of the text object
   * @param next_font The name of the new font.
   */
  const change_font_family = React.useCallback(
    (next_font: string) => {
      const font_family = FONT_NAME_TO_FAMILY_MAP[next_font];

      if (!font_family) {
        return;
      }

      set_font_family(next_font);

      const font_loader = new FontFaceObserver(font_family);

      if (font_family === "monospace") {
        if (active_object) {
          modify_object(active_object, {
            fontFamily: font_family,
            fontName: next_font
          });
        }
      } else {
        set_loading(true);

        font_loader
          .load()
          .then(() => {
            if (active_object) {
              modify_object(active_object, {
                fontFamily: font_family,
                fontName: next_font
              });
            }
          })
          .catch(dev_console.error)
          .finally(() => set_loading(false));
      }
    },
    [active_object]
  );

  // Initialize the selected font on load
  React.useEffect(() => {
    if (mounted_ref.current) {
      return;
    }

    mounted_ref.current = true;
    change_font_family(active_object?.get("fontName") || "Satoshi");

    return () => {
      mounted_ref.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Select
      onValueChange={(next_value): void => change_font_family(next_value)}
      size={"sm"}
      slot_props={{
        content: {
          style: {
            zIndex: "calc(var(--z-index-modal) + 2)"
          }
        },
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        value: { asChild: true },
        trigger: {
          className: css["full-w"]
        }
      }}
      value={font_family}
      value_children={
        <div className={css["flex-center"]} style={{ gap: "6px" }}>
          {loading && <Spinner size={"xs"} />}
          {font_family}
        </div>
      }
    >
      <Option value={"Satoshi"}>Satoshi</Option>
      <Option value={"Virgil"}>Virgil</Option>
      <Option value={"Monospace"}>Monospace</Option>
    </Select>
  );
};

// Font weight

const FontWeightControl = ({
  active_object
}: {
  active_object: FabricObject;
}): React.ReactElement => {
  const [font_weight, set_font_weight] = React.useState<string>(
    active_object?.get("fontWeight") || "400"
  );

  /**
   * Mutates the font weight of the text object
   * @param next_weight The new weight
   */
  const change_font_weight = React.useCallback(
    (next_weight: string) => {
      set_font_weight(next_weight);

      if (active_object) {
        modify_object(active_object, {
          fontWeight: next_weight
        });
      }
    },
    [active_object]
  );

  React.useEffect(() => {
    set_font_weight(active_object?.get("fontWeight") || "400");
  }, [active_object]);

  return (
    <Select
      onValueChange={(next_value): void => change_font_weight(next_value)}
      size={"sm"}
      slot_props={{
        content: {
          style: {
            zIndex: "calc(var(--z-index-modal) + 2)"
          }
        },
        trigger: {
          className: css["full-w"],
          style: { flex: "0.6" }
        }
      }}
      value={font_weight}
    >
      <Option value={"300"}>Light</Option>
      <Option value={"400"}>Normal</Option>
      <Option value={"500"}>Medium</Option>
      <Option value={"700"}>Bold</Option>
    </Select>
  );
};

// Font size

const FontSizeControl = ({
  active_object
}: {
  active_object: FabricObject;
}): React.ReactElement => {
  /**
   * Mutates the font size of the text object
   */
  const change_font_size = React.useCallback(
    (next_font_size: number) => {
      if (active_object) {
        modify_object(active_object, { fontSize: next_font_size });
      }
    },
    [active_object]
  );

  return (
    <Input
      aria-label={"Font size"}
      decorator={<TextSizeIcon />}
      defaultValue={active_object.get("fontSize") ?? DEFAULT_FONT_SIZE}
      max={10_000}
      min={1}
      monospaced
      onChange={(event): void => {
        change_font_size(
          clamp(
            1,
            Number.parseInt(event.target.value) ?? DEFAULT_FONT_SIZE,
            10_000
          )
        );
      }}
      placeholder={"Font size"}
      size={"sm"}
      slot_props={{
        container: {
          style: { flex: "0.4" }
        }
      }}
      step={1}
      title={"Font size"}
      type={"number"}
    />
  );
};

// Line height

const LineHeightControl = ({
  active_object
}: {
  active_object: FabricObject;
}): React.ReactElement => {
  /**
   * Mutates the line height of the text object
   */
  const change_line_height = React.useCallback(
    (next_line_height: number) => {
      if (active_object) {
        modify_object(active_object, { lineHeight: next_line_height });
      }
    },
    [active_object]
  );

  return (
    <Input
      aria-label={"Line height"}
      decorator={<LineHeightIcon />}
      defaultValue={active_object.get("lineHeight") ?? DEFAULT_LINE_HEIGHT}
      max={15}
      min={0.1}
      monospaced
      onChange={(event): void => {
        change_line_height(
          clamp(
            1,
            Number.parseFloat(event.target.value) ?? DEFAULT_LINE_HEIGHT,
            15
          )
        );
      }}
      placeholder={"Line height"}
      size={"sm"}
      slot_props={{ container: { className: css["f-grow"] } }}
      step={0.1}
      title={"Line height"}
      type={"number"}
    />
  );
};

// Letter spacing

const LetterSpacingControl = ({
  active_object
}: {
  active_object: FabricObject;
}): React.ReactElement => {
  /**
   * Mutates the letter spacing of the text object
   */
  const change_letter_spacing = React.useCallback(
    (next_spacing: number) => {
      if (active_object) {
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        modify_object(active_object, { charSpacing: next_spacing * 1000 });
      }
    },
    [active_object]
  );

  return (
    <Input
      aria-label={"Letter spacing"}
      decorator={<LetterSpacingIcon />}
      defaultValue={
        (active_object.get("charSpacing") ?? DEFAULT_LETTER_SPACING) / 1000
      }
      max={100}
      min={0}
      monospaced
      onChange={(event): void => {
        change_letter_spacing(
          clamp(
            0,
            Number.parseFloat(event.target.value) ?? DEFAULT_LETTER_SPACING,
            100
          )
        );
      }}
      placeholder={"Letter spacing"}
      size={"sm"}
      slot_props={{ container: { className: css["f-grow"] } }}
      step={0.1}
      title={"Letter spacing"}
      type={"number"}
    />
  );
};

// Text alignment and style

const TextStyleControl = ({
  active_object
}: {
  active_object: FabricObject;
}): React.ReactElement => {
  const [text_align, set_text_align] = React.useState<string>(
    active_object?.get("textAlign") || "left"
  );
  const [italic, set_italic] = React.useState<boolean>(
    active_object?.get("fontStyle") === "italic"
  );
  const [underline, set_underline] = React.useState<boolean>(
    Boolean(active_object?.get("underline"))
  );
  const [strikethrough, set_strikethrough] = React.useState<boolean>(
    Boolean(active_object?.get("linethrough"))
  );

  /**
   * Mutates the alignment of the text object
   */
  const change_alignment = React.useCallback(
    (next_alignment: string) => {
      set_text_align(next_alignment);

      if (active_object) {
        // eslint-disable-next-line prefer-snakecase/prefer-snakecase
        modify_object(active_object, { textAlign: next_alignment });
      }
    },
    [active_object]
  );

  /**
   * Toggles the underline style
   */
  const toggle_underline = React.useCallback(
    (value: boolean) => {
      set_underline(value);

      if (active_object) {
        modify_object(active_object, { underline: value });
      }
    },
    [active_object]
  );

  /**
   * Toggles the strikethrough style
   */
  const toggle_strikethrough = React.useCallback(
    (value: boolean) => {
      set_strikethrough(value);

      if (active_object) {
        modify_object(active_object, { linethrough: value });
      }
    },
    [active_object]
  );

  /**
   * Toggles the italic style
   */
  const toggle_italic = React.useCallback(
    (value: boolean) => {
      set_italic(value);

      if (active_object) {
        modify_object(active_object, {
          // eslint-disable-next-line prefer-snakecase/prefer-snakecase
          fontStyle: value ? "italic" : "normal"
        });
      }
    },
    [active_object]
  );

  React.useEffect(() => {
    if (active_object) {
      set_text_align(active_object.get("textAlign") || "left");
      set_underline(Boolean(active_object.get("underline")));
      set_strikethrough(Boolean(active_object.get("linethrough")));
      set_italic(active_object.get("fontStyle") === "italic");
    }
  }, [active_object]);

  return (
    <DrawItemRow>
      <ToggleGroup
        onValueChange={change_alignment}
        size={"xs"}
        value={text_align}
      >
        <ToggleGroupItem
          aria-label={"Left align"}
          tooltip_content={"Left align"}
          value={"left"}
        >
          <AlignLeftIcon />
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label={"Center align"}
          tooltip_content={"Center align"}
          value={"center"}
        >
          <AlignCenterIcon />
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label={"Right align"}
          tooltip_content={"Right align"}
          value={"right"}
        >
          <AlignLeftIcon />
        </ToggleGroupItem>
        <ToggleGroupItem
          aria-label={"Justify align"}
          tooltip_content={"Justify align"}
          value={"justify"}
        >
          <AlignJustifyIcon />
        </ToggleGroupItem>
      </ToggleGroup>
      <Grow />
      <div className={css["flex-center"]}>
        <Toggle
          aria-label={`${italic ? "Remove italics" : "Italic"}`}
          onPressedChange={toggle_italic}
          pressed={italic}
          size={"xs"}
          title={`${italic ? "Remove italics" : "Italic"}`}
        >
          <ItalicIcon />
        </Toggle>
        <Toggle
          aria-label={`${underline ? "Remove underline" : "Underline"}`}
          onPressedChange={toggle_underline}
          pressed={underline}
          size={"xs"}
          title={`${underline ? "Remove underline" : "Underline"}`}
        >
          <UnderlineIcon />
        </Toggle>
        <Toggle
          aria-label={`${
            strikethrough ? "Remove strikethrough" : "Strikethrough"
          }`}
          onPressedChange={toggle_strikethrough}
          pressed={strikethrough}
          size={"xs"}
          title={`${strikethrough ? "Remove strikethrough" : "Strikethrough"}`}
        >
          <StrikethroughIcon />
        </Toggle>
      </div>
    </DrawItemRow>
  );
};

const TextProps = (): React.ReactElement | null => {
  const active_object = use_active_object();

  if (!active_object) {
    return null;
  }

  return (
    <React.Fragment key={active_object.get("id")}>
      <DrawItem>
        <DrawItemRow>
          <FontFamilyControl active_object={active_object} />
        </DrawItemRow>
        <DrawItemRow>
          <FontWeightControl active_object={active_object} />
          <FontSizeControl active_object={active_object} />
        </DrawItemRow>
        <DrawItemRow>
          <LineHeightControl active_object={active_object} />
          <LetterSpacingControl active_object={active_object} />
        </DrawItemRow>
      </DrawItem>
      <SpacerWithDivider />
      <DrawItem>
        <TextStyleControl active_object={active_object} />
      </DrawItem>
    </React.Fragment>
  );
};

export default TextProps;
