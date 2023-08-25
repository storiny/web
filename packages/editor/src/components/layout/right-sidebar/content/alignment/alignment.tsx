import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useAtomValue } from "jotai";
import { ElementFormatType, FORMAT_ELEMENT_COMMAND } from "lexical";
import React from "react";

import ToggleGroup from "~/components/ToggleGroup";
import ToggleGroupItem from "~/components/ToggleGroupItem";

import { alignmentAtom } from "../../../../../atoms";
import {
  Alignment as AlignmentEnum,
  alignmentToIconMap
} from "../../../../../constants";

// Item

const Item = ({
  label,
  alignment,
  disabled
}: {
  alignment: AlignmentEnum;
  disabled?: boolean;
  label: React.ReactNode;
}): React.ReactElement => (
  <ToggleGroupItem disabled={disabled} tooltipContent={label} value={alignment}>
    {alignmentToIconMap[alignment]}
  </ToggleGroupItem>
);

const Alignment = ({
  disabled
}: {
  disabled?: boolean;
}): React.ReactElement => {
  const [editor] = useLexicalComposerContext();
  const value = useAtomValue(alignmentAtom);

  /**
   * Updates the node alignment
   * @param newValue New alignment
   */
  const handleChange = (newValue: string): void => {
    editor.dispatchCommand(
      FORMAT_ELEMENT_COMMAND,
      newValue as ElementFormatType
    );
  };

  return (
    <ToggleGroup onValueChange={handleChange} value={value}>
      <Item
        alignment={AlignmentEnum.LEFT}
        disabled={disabled}
        label={"Left align"}
      />
      <Item
        alignment={AlignmentEnum.CENTER}
        disabled={disabled}
        label={"Center align"}
      />
      <Item
        alignment={AlignmentEnum.RIGHT}
        disabled={disabled}
        label={"Right align"}
      />
      <Item
        alignment={AlignmentEnum.JUSTIFY}
        disabled={disabled}
        label={"Justify align"}
      />
    </ToggleGroup>
  );
};

export default Alignment;
