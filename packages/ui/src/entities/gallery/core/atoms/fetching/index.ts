import { atomWithReset } from "jotai/utils";

export const fetchingAtom = atomWithReset<boolean>(false);
