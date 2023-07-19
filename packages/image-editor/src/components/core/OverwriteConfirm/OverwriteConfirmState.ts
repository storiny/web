import { atom } from "jotai";
import React from "react";

import { jotaiStore } from "../../../core/jotai";

export type OverwriteConfirmState =
  | {
      actionLabel: string;
      active: true;
      color: "danger" | "warning";
      description: React.ReactNode;
      onClose: () => void;

      onConfirm: () => void;
      onReject: () => void;
      title: string;
    }
  | { active: false };

export const overwriteConfirmStateAtom = atom<OverwriteConfirmState>({
  active: false
});

export const openConfirmModal = async ({
  title,
  description,
  actionLabel,
  color
}: {
  actionLabel: string;
  color: "danger" | "warning";
  description: React.ReactNode;
  title: string;
}) =>
  new Promise<boolean>((resolve) => {
    jotaiStore.set(overwriteConfirmStateAtom, {
      active: true,
      onConfirm: () => resolve(true),
      onClose: () => resolve(false),
      onReject: () => resolve(false),
      title,
      description,
      actionLabel,
      color
    });
  });
