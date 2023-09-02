import { atom } from "jotai";

import { ProviderAwareness } from "../../collab/provider";

export const awarenessAtom = atom<ProviderAwareness | null>(null);
