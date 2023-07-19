import clsx from "clsx";

import { actionShortcuts } from "../../../core/actions";
import { ActionManager } from "../../../core/actions/manager";
import { useTunnels } from "../../../core/context/tunnels";
import { UIAppState } from "../../../core/types";
import {
  ExitZenModeAction,
  FinalizeAction,
  UndoRedoActions,
  ZoomActions
} from "../Actions";
import { useDevice } from "../App";
import { HelpButton } from "../HelpButton";
import { Section } from "../Section";
import Stack from "../Stack";

const Footer = ({
  editorState,
  actionManager,
  showExitZenModeBtn,
  renderWelcomeScreen
}: {
  actionManager: ActionManager;
  editorState: UIAppState;
  renderWelcomeScreen: boolean;
  showExitZenModeBtn: boolean;
}) => {
  const { FooterCenterTunnel, WelcomeScreenHelpHintTunnel } = useTunnels();

  const device = useDevice();
  const showFinalize =
    !editorState.viewModeEnabled &&
    editorState.multiLayer &&
    device.isTouchScreen;

  return (
    <footer
      className="layer-ui__wrapper__footer App-menu App-menu_bottom"
      role="contentinfo"
    >
      <div
        className={clsx("layer-ui__wrapper__footer-left zen-mode-transition", {
          "layer-ui__wrapper__footer-left--transition-left":
            editorState.zenModeEnabled
        })}
      >
        <Stack.Col gap={2}>
          <Section heading="canvasActions">
            <ZoomActions
              renderAction={actionManager.renderAction}
              zoom={editorState.zoom}
            />

            {!editorState.viewModeEnabled && (
              <UndoRedoActions
                className={clsx("zen-mode-transition", {
                  "layer-ui__wrapper__footer-left--transition-bottom":
                    editorState.zenModeEnabled
                })}
                renderAction={actionManager.renderAction}
              />
            )}
            {showFinalize && (
              <FinalizeAction
                className={clsx("zen-mode-transition", {
                  "layer-ui__wrapper__footer-left--transition-left":
                    editorState.zenModeEnabled
                })}
                renderAction={actionManager.renderAction}
              />
            )}
          </Section>
        </Stack.Col>
      </div>
      <FooterCenterTunnel.Out />
      <div
        className={clsx("layer-ui__wrapper__footer-right zen-mode-transition", {
          "transition-right disable-pointerEvents": editorState.zenModeEnabled
        })}
      >
        <div style={{ position: "relative" }}>
          {renderWelcomeScreen && <WelcomeScreenHelpHintTunnel.Out />}
          <HelpButton
            onClick={() => actionManager.executeAction(actionShortcuts)}
          />
        </div>
      </div>
      <ExitZenModeAction
        actionManager={actionManager}
        showExitZenModeBtn={showExitZenModeBtn}
      />
    </footer>
  );
};

export default Footer;
Footer.displayName = "Footer";
