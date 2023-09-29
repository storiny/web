import { atom } from "jotai";

import { Provider } from "../../collaboration/provider";

export const awareness_atom = atom<Provider["awareness"] | null>(null);
