import { useAtom } from "jotai";
import React from "react";

import Input, { InputProps } from "~/components/Input";
import { queryAtom } from "~/entities/Gallery/core/atoms";
import SearchIcon from "~/icons/Search";

const SearchInput = (props: InputProps): React.ReactElement => {
  const [value, setValue] = useAtom(queryAtom);
  return (
    <Input
      {...props}
      decorator={<SearchIcon />}
      onChange={(event): void => setValue(event.target.value)}
      placeholder={"Search"}
      size={"sm"}
      type={"search"}
      value={value}
    />
  );
};

export default SearchInput;
