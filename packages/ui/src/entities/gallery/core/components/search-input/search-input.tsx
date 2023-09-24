import { useAtom, useAtomValue } from "jotai";
import React from "react";

import Input, { InputProps } from "~/components/Input";
import SearchIcon from "~/icons/Search";

import { queryAtom, uploadingAtom } from "../../atoms";

const SearchInput = (props: InputProps): React.ReactElement => {
  const { disabled, size = "sm", ...rest } = props;
  const [value, setValue] = useAtom(queryAtom);
  const isUploading = useAtomValue(uploadingAtom);

  return (
    <Input
      {...rest}
      decorator={<SearchIcon />}
      disabled={isUploading || disabled}
      onChange={(event): void => setValue(event.target.value)}
      placeholder={"Search"}
      size={size}
      type={"search"}
      value={value}
    />
  );
};

export default SearchInput;
