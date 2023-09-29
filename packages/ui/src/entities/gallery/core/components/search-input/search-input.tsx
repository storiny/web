import { useAtom as use_atom, useAtomValue as use_atom_value } from "jotai";
import React from "react";

import Input, { InputProps } from "src/components/input";
import SearchIcon from "~/icons/Search";

import { query_atom, uploading_atom } from "../../atoms";

const SearchInput = (props: InputProps): React.ReactElement => {
  const { disabled, size = "sm", ...rest } = props;
  const [value, set_value] = use_atom(query_atom);
  const is_uploading = use_atom_value(uploading_atom);

  return (
    <Input
      {...rest}
      decorator={<SearchIcon />}
      disabled={is_uploading || disabled}
      onChange={(event): void => set_value(event.target.value)}
      placeholder={"Search"}
      size={size}
      type={"search"}
      value={value}
    />
  );
};

export default SearchInput;
