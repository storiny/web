import { atomWithReset as atom_with_reset } from "jotai/utils";

export const uploading_atom = atom_with_reset<boolean>(false);
