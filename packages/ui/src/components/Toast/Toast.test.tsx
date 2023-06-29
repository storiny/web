import { axe } from "@storiny/test-utils";
import { waitFor } from "@testing-library/react";
import React from "react";

import { renderTestWithProvider } from "~/redux/testUtils";

import ToastProvider from "./Provider";
import Toast from "./Toast";
import styles from "./Toast.module.scss";
import { ToastProps, ToastSeverity } from "./Toast.props";

describe("<Toast />", () => {
  it("renders and matches snapshot", () => {
    const { baseElement, getByTestId } = renderTestWithProvider(
      <ToastProvider>
        <Toast data-testid={"toast"} open>
          Test
        </Toast>
      </ToastProvider>
    );

    expect(baseElement).toMatchSnapshot();
    expect(getByTestId("toast")).toBeInTheDocument();
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = renderTestWithProvider(
      <ToastProvider>
        <Toast open>Test</Toast>
      </ToastProvider>
    );

    await waitFor(async () =>
      expect(
        await axe(baseElement, {
          rules: {
            "aria-allowed-role": { enabled: false },
            list: { enabled: false },
          },
        })
      ).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = renderTestWithProvider(
      <ToastProvider>
        <Toast as={"aside"} data-testid={"toast"} open>
          Toast
        </Toast>
      </ToastProvider>
    );

    expect(getByTestId("toast").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders severity `blank` by default", () => {
    const { getByTestId } = renderTestWithProvider(
      <ToastProvider>
        <Toast data-testid={"toast"} open>
          Test
        </Toast>
      </ToastProvider>
    );

    expect(getByTestId("toast")).not.toHaveClass(
      ...[styles.info, styles.success, styles.error, styles.warning]
    );
  });

  (["info", "success", "error", "warning"] as ToastSeverity[]).forEach(
    (severity) => {
      it(`renders \`${severity}\` severity and passes props to the decorator slot`, () => {
        const { getByTestId } = renderTestWithProvider(
          <ToastProvider>
            <Toast
              open
              severity={severity}
              slotProps={{
                decorator: {
                  "data-testid": "decorator",
                } as React.ComponentPropsWithoutRef<"span">,
              }}
            >
              Test
            </Toast>
          </ToastProvider>
        );

        const decorator = getByTestId("decorator");
        expect(decorator).toHaveClass(styles[severity]);
      });
    }
  );

  it("passes props to the close slot", () => {
    const { getByTestId } = renderTestWithProvider(
      <ToastProvider>
        <Toast
          open
          slotProps={
            {
              close: { "data-testid": "close" },
            } as ToastProps["slotProps"]
          }
        >
          Test
        </Toast>
      </ToastProvider>
    );

    expect(getByTestId("close")).toBeInTheDocument();
  });
});
