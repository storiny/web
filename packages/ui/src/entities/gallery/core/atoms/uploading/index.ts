import { atomWithReset } from "jotai/utils";

export const uploadingAtom = atomWithReset<boolean>(false);
