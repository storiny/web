// Import { useRouter } from "next/navigation";
// Import React from "react";
//
// Import { useNotification } from "~/components/Notification";
// Import TypographyIcon from "~/icons/Typography";
// Import { setFontSettingsNotificationVisibility } from "~/redux/features";
// Import { useAppDispatch, useAppSelector } from "~/redux/hooks";

// TODO: Implement once `useNotification` gets fixed
//
// Const EditorFontSettingsNotification = (): null => {
//   Const router = useRouter();
//   Const notify = useNotification();
//   Const dispatch = useAppDispatch();
//   Const showNotification = useAppSelector(
//     (state) => state.preferences.show_font_settings_notification
//   );
//
//   React.useEffect(() => {
//     If (showNotification) {
//       Notify({
//         Open: true,
//         Children:
//           "Difficulty reading? Try adjusting font properties in your settings.",
//         PrimaryButtonText: "Settings",
//         SlotProps: {
//           PrimaryButton: {
//             OnClick: (): void => router.push("/me/settings/appearance")
//           },
//           SecondaryButton: {
//             OnClick: (): void => {
//               Dispatch(setFontSettingsNotificationVisibility(false));
//             }
//           }
//         },
//         Icon: <TypographyIcon />
//       });
//     }
//   }, [dispatch, notify, router, showNotification]);
//
//   Return null;
// };
//
// Export default EditorFontSettingsNotification;
