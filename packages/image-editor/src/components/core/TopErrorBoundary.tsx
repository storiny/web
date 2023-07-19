import * as Sentry from "@sentry/browser";
import React from "react";

import { t } from "../i18n";
import Trans from "./Trans";

interface TopErrorBoundaryState {
  hasError: boolean;
  localStorage: string;
  sentryEventId: string;
}

export class TopErrorBoundary extends React.Component<
  any,
  TopErrorBoundaryState
> {
  state: TopErrorBoundaryState = {
    hasError: false,
    sentryEventId: "",
    localStorage: ""
  };

  render() {
    return this.state.hasError ? this.errorSplash() : this.props.children;
  }

  componentDidCatch(error: Error, errorInfo: any) {
    const _localStorage: any = {};
    for (const [key, value] of Object.entries({ ...localStorage })) {
      try {
        _localStorage[key] = JSON.parse(value);
      } catch (error: any) {
        _localStorage[key] = value;
      }
    }

    Sentry.withScope((scope) => {
      scope.setExtras(errorInfo);
      const eventId = Sentry.captureException(error);

      this.setState((state) => ({
        hasError: true,
        sentryEventId: eventId,
        localStorage: JSON.stringify(_localStorage)
      }));
    });
  }

  private selectTextArea(event: React.MouseEvent<HTMLTextAreaLayer>) {
    if (event.target !== document.activeLayer) {
      event.preventDefault();
      (event.target as HTMLTextAreaLayer).select();
    }
  }

  private async createGithubIssue() {
    let body = "";
    try {
      const templateStrFn = (
        await import(
          /* webpackChunkName: "bug-issue-template" */ "../bug-issue-template"
        )
      ).default;
      body = encodeURIComponent(templateStrFn(this.state.sentryEventId));
    } catch (error: any) {
      console.error(error);
    }

    window.open(
      `https://github.com/excalidraw/excalidraw/issues/new?body=${body}`
    );
  }

  private errorSplash() {
    return (
      <div className="ErrorSplash excalidraw">
        <div className="ErrorSplash-messageContainer">
          <div className="ErrorSplash-paragraph bigger align-center">
            <Trans
              button={(el) => (
                <button onClick={() => window.location.reload()}>{el}</button>
              )}
              i18nKey="errorSplash.headingMain"
            />
          </div>
          <div className="ErrorSplash-paragraph align-center">
            <Trans
              button={(el) => (
                <button
                  onClick={() => {
                    try {
                      localStorage.clear();
                      window.location.reload();
                    } catch (error: any) {
                      console.error(error);
                    }
                  }}
                >
                  {el}
                </button>
              )}
              i18nKey="errorSplash.clearCanvasMessage"
            />
            <br />
            <div className="smaller">
              <span aria-label="warning" role="img">
                ⚠️
              </span>
              {t("errorSplash.clearCanvasCaveat")}
              <span aria-hidden="true" role="img">
                ⚠️
              </span>
            </div>
          </div>
          <div>
            <div className="ErrorSplash-paragraph">
              {t("errorSplash.trackedToSentry", {
                eventId: this.state.sentryEventId
              })}
            </div>
            <div className="ErrorSplash-paragraph">
              <Trans
                button={(el) => (
                  <button onClick={() => this.createGithubIssue()}>{el}</button>
                )}
                i18nKey="errorSplash.openIssueMessage"
              />
            </div>
            <div className="ErrorSplash-paragraph">
              <div className="ErrorSplash-details">
                <label>{t("errorSplash.sceneContent")}</label>
                <textarea
                  onPointerDown={this.selectTextArea}
                  readOnly={true}
                  rows={5}
                  value={this.state.localStorage}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
