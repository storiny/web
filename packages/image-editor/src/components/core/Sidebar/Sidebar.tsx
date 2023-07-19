import "./Sidebar.scss";

import clsx from "clsx";
import { atom, useSetAtom } from "jotai";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState
} from "react";

import { EVENT } from "../../../core/constants";
import { jotaiScope } from "../../../core/jotai";
import { useOutsideClick } from "../../../lib/hooks/useOutsideClick/useOutsideClick";
import { updateObject } from "../../../lib/utils/utils";
import { useUIAppState } from "../../context/ui-editorState";
import { KEYS } from "../../keys";
import { useDevice, useExcalidrawSetAppState } from "../App";
import { Island } from "../Island";
import {
  SidebarProps,
  SidebarPropsContext,
  SidebarPropsContextValue
} from "./common";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarTab } from "./SidebarTab";
import { SidebarTabs } from "./SidebarTabs";
import { SidebarTabTrigger } from "./SidebarTabTrigger";
import { SidebarTabTriggers } from "./SidebarTabTriggers";
import { SidebarTrigger } from "./SidebarTrigger";

/**
 * Flags whether the currently rendered Sidebar is docked or not, for use
 * in upstream components that need to act on this (e.g. LayerUI to shift the
 * UI). We use an atom because of potential host app sidebars (for the default
 * sidebar we could just read from editorState.defaultSidebarDockedPreference).
 *
 * Since we can only render one Sidebar at a time, we can use a simple flag.
 */
export const isSidebarDockedAtom = atom(false);

export const SidebarInner = forwardRef(
  (
    {
      name,
      children,
      onDock,
      docked,
      className,
      ...rest
    }: SidebarProps & Omit<React.RefAttributes<HTMLDivLayer>, "onSelect">,
    ref: React.ForwardedRef<HTMLDivLayer>
  ) => {
    if (process.env.NODE_ENV === "development" && onDock && docked == null) {
      console.warn(
        "Sidebar: `docked` must be set when `onDock` is supplied for the sidebar to be user-dockable. To hide this message, either pass `docked` or remove `onDock`"
      );
    }

    const setAppState = useExcalidrawSetAppState();

    const setIsSidebarDockedAtom = useSetAtom(isSidebarDockedAtom, jotaiScope);

    useLayoutEffect(() => {
      setIsSidebarDockedAtom(!!docked);
      return () => {
        setIsSidebarDockedAtom(false);
      };
    }, [setIsSidebarDockedAtom, docked]);

    const headerPropsRef = useRef<SidebarPropsContextValue>(
      {} as SidebarPropsContextValue
    );
    headerPropsRef.current.onCloseRequest = () => {
      setAppState({ openSidebar: null });
    };
    headerPropsRef.current.onDock = (isDocked) => onDock?.(isDocked);
    // renew the ref object if the following props change since we want to
    // rerender. We can't pass down as component props manually because
    // the <Sidebar.Header/> can be rendered upstream.
    headerPropsRef.current = updateObject(headerPropsRef.current, {
      docked,
      // explicit prop to rerender on update
      shouldRenderDockButton: !!onDock && docked != null
    });

    const islandRef = useRef<HTMLDivLayer>(null);

    useImperativeHandle(ref, () => islandRef.current!);

    const device = useDevice();

    const closeLibrary = useCallback(() => {
      const isDialogOpen = !!document.querySelector(".Dialog");

      // Prevent closing if any dialog is open
      if (isDialogOpen) {
        return;
      }
      setAppState({ openSidebar: null });
    }, [setAppState]);

    useOutsideClick(
      islandRef,
      useCallback(
        (event) => {
          // If click on the library icon, do nothing so that LibraryButton
          // can toggle library menu
          if ((event.target as Layer).closest(".sidebar-trigger")) {
            return;
          }
          if (!docked || !device.canDeviceFitSidebar) {
            closeLibrary();
          }
        },
        [closeLibrary, docked, device.canDeviceFitSidebar]
      )
    );

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (
          event.key === KEYS.ESCAPE &&
          (!docked || !device.canDeviceFitSidebar)
        ) {
          closeLibrary();
        }
      };
      document.addEventListener(EVENT.KEYDOWN, handleKeyDown);
      return () => {
        document.removeEventListener(EVENT.KEYDOWN, handleKeyDown);
      };
    }, [closeLibrary, docked, device.canDeviceFitSidebar]);

    return (
      <Island
        {...rest}
        className={clsx("sidebar", { "sidebar--docked": docked }, className)}
        ref={islandRef}
      >
        <SidebarPropsContext.Provider value={headerPropsRef.current}>
          {children}
        </SidebarPropsContext.Provider>
      </Island>
    );
  }
);
SidebarInner.displayName = "SidebarInner";

export const Sidebar = Object.assign(
  forwardRef((props: SidebarProps, ref: React.ForwardedRef<HTMLDivLayer>) => {
    const editorState = useUIAppState();

    const { onStateChange } = props;

    const refPrevOpenSidebar = useRef(editorState.openSidebar);
    useEffect(() => {
      if (
        // closing sidebar
        ((!editorState.openSidebar &&
          refPrevOpenSidebar?.current?.name === props.name) ||
          // opening current sidebar
          (editorState.openSidebar?.name === props.name &&
            refPrevOpenSidebar?.current?.name !== props.name) ||
          // switching tabs or switching to a different sidebar
          refPrevOpenSidebar.current?.name === props.name) &&
        editorState.openSidebar !== refPrevOpenSidebar.current
      ) {
        onStateChange?.(
          editorState.openSidebar?.name !== props.name
            ? null
            : editorState.openSidebar
        );
      }
      refPrevOpenSidebar.current = editorState.openSidebar;
    }, [editorState.openSidebar, onStateChange, props.name]);

    const [mounted, setMounted] = useState(false);
    useLayoutEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);

    // We want to render in the next tick (hence `mounted` flag) so that it's
    // guaranteed to happen after unmount of the previous sidebar (in case the
    // previous sidebar is mounted after the next one). This is necessary to
    // prevent flicker of subcomponents that support fallbacks
    // (e.g. SidebarHeader). This is because we're using flags to determine
    // whether prefer the fallback component or not (otherwise both will render
    // initially), and the flag won't be reset in time if the unmount order
    // it not correct.
    //
    // Alternative, and more general solution would be to namespace the fallback
    // HoC so that state is not shared between subcomponents when the wrapping
    // component is of the same type (e.g. Sidebar -> SidebarHeader).
    const shouldRender =
      mounted && editorState.openSidebar?.name === props.name;

    if (!shouldRender) {
      return null;
    }

    return <SidebarInner {...props} key={props.name} ref={ref} />;
  }),
  {
    Header: SidebarHeader,
    TabTriggers: SidebarTabTriggers,
    TabTrigger: SidebarTabTrigger,
    Tabs: SidebarTabs,
    Tab: SidebarTab,
    Trigger: SidebarTrigger
  }
);
Sidebar.displayName = "Sidebar";
