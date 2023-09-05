import { atomWithReset } from "jotai/utils";

export const pendingImageAtom = atomWithReset<string | null>(null);
