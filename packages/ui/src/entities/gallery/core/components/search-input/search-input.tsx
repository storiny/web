import { useAtom, useAtomValue } from "jotai";
import React from "react";

import Input, { InputProps } from "~/components/Input";
import Spinner from "~/components/Spinner";
import { useDebounce } from "~/hooks/useDebounce";
import SearchIcon from "~/icons/Search";

import {
  fetchingAtom,
  GallerySidebarTabsValue,
  queryAtom,
  sidebarTabAtom,
  uploadingAtom
} from "../../atoms";

const SearchInput = (props: InputProps): React.ReactElement => {
  const [value, setValue] = useAtom(queryAtom);
  const debouncedValue = useDebounce(value);
  const tab = useAtomValue(sidebarTabAtom);
  const isFetching = useAtomValue(fetchingAtom);
  const isUploading = useAtomValue(uploadingAtom);
  const isTyping = value !== debouncedValue;

  return (
    <Input
      {...props}
      decorator={
        (isFetching || isTyping) &&
        (["pexels", "library"] as GallerySidebarTabsValue[]).includes(tab) ? (
          <Spinner size={"xs"} />
        ) : (
          <SearchIcon />
        )
      }
      disabled={isUploading}
      onChange={(event): void => setValue(event.target.value)}
      placeholder={"Search"}
      size={"sm"}
      type={"search"}
      value={value}
    />
  );
};

export default SearchInput;
