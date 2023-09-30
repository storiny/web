import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import ToastProvider from "./provider";
import Toast from "./toast";
import styles from "./toast.module.scss";
import { ToastProps, ToastSeverity } from "./toast.props";

describe("<Toast />", () => {
  it("renders and matches snapshot", () => {
    const { baseElement, getByTestId } = render_test_with_provider(
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
    const { baseElement } = render_test_with_provider(
      <ToastProvider>
        <Toast open>Test</Toast>
      </ToastProvider>
    );

    await wait_for(async () =>
      expect(
        await axe(baseElement, {
          rules: {
            "aria-allowed-role": { enabled: false },
            list: { enabled: false }
          }
        })
      ).toHaveNoViolations()
    );
  });

  it("renders as a polymorphic element", () => {
    const { getByTestId } = render_test_with_provider(
      <ToastProvider>
        <Toast as={"aside"} data-testid={"toast"} open>
          Toast
        </Toast>
      </ToastProvider>
    );

    expect(getByTestId("toast").nodeName.toLowerCase()).toEqual("aside");
  });

  it("renders severity `blank` by default", () => {
    const { getByTestId } = render_test_with_provider(
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
        const { getByTestId } = render_test_with_provider(
          <ToastProvider>
            <Toast
              open
              severity={severity}
              slot_props={{
                decorator: {
                  "data-testid": "decorator"
                } as React.ComponentPropsWithoutRef<"span">
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
    const { getByTestId } = render_test_with_provider(
      <ToastProvider>
        <Toast
          open
          slot_props={
            {
              close: { "data-testid": "close" }
            } as ToastProps["slot_props"]
          }
        >
          Test
        </Toast>
      </ToastProvider>
    );

    expect(getByTestId("close")).toBeInTheDocument();
  });
});
