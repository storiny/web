import { atomWithReset as atom_with_reset } from "jotai/utils";

export const pending_image_atom = atom_with_reset<string | null>(null);
