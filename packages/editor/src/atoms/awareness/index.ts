import { atom } from "jotai";

import { Provider } from "../../collaboration/provider";

export const awarenessAtom = atom<Provider["awareness"] | null>(null);
