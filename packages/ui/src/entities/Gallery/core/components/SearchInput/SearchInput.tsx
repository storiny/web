import { useAtom, useAtomValue } from "jotai";
import React from "react";

import Input, { InputProps } from "~/components/Input";
import Spinner from "~/components/Spinner";
import { useDebounce } from "~/hooks/useDebounce";
import SearchIcon from "~/icons/Search";

import { fetchingAtom, queryAtom } from "../../atoms";

const SearchInput = (props: InputProps): React.ReactElement => {
  const [value, setValue] = useAtom(queryAtom);
  const debouncedValue = useDebounce(value);
  const isFetching = useAtomValue(fetchingAtom);
  const isTyping = value !== debouncedValue;

  return (
    <Input
      {...props}
      decorator={
        isFetching || isTyping ? <Spinner size={"xs"} /> : <SearchIcon />
      }
      onChange={(event): void => setValue(event.target.value)}
      placeholder={"Search"}
      size={"sm"}
      type={"search"}
      value={value}
    />
  );
};

export default SearchInput;
