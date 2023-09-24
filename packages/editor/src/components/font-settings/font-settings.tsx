// import { useRouter } from "next/navigation";
// import React from "react";
//
// import { useNotification } from "~/components/Notification";
// import TypographyIcon from "~/icons/Typography";
// import { setFontSettingsNotificationVisibility } from "~/redux/features";
// import { useAppDispatch, useAppSelector } from "~/redux/hooks";

// TODO: Implement once `useNotification` gets fixed
//
// const EditorFontSettingsNotification = (): null => {
//   const router = useRouter();
//   const notify = useNotification();
//   const dispatch = useAppDispatch();
//   const showNotification = useAppSelector(
//     (state) => state.preferences.showFontSettingsNotification
//   );
//
//   React.useEffect(() => {
//     if (showNotification) {
//       notify({
//         open: true,
//         children:
//           "Difficulty reading? Try adjusting font properties in your settings.",
//         primaryButtonText: "Settings",
//         slotProps: {
//           primaryButton: {
//             onClick: (): void => router.push("/me/settings/appearance")
//           },
//           secondaryButton: {
//             onClick: (): void => {
//               dispatch(setFontSettingsNotificationVisibility(false));
//             }
//           }
//         },
//         icon: <TypographyIcon />
//       });
//     }
//   }, [dispatch, notify, router, showNotification]);
//
//   return null;
// };
//
// export default EditorFontSettingsNotification;
