import { axe } from "@storiny/test-utils";
import { waitFor as wait_for } from "@testing-library/react";
import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import ReportModal from "./report-modal";

describe("<ReportModal />", () => {
  it("renders", () => {
    render_test_with_provider(
      <ReportModal
        entity_id={""}
        entity_type={"story"}
        open
        trigger={(): React.ReactElement => <button>test</button>}
      />
    );
  });

  it("does not have any accessibility violations", async () => {
    const { baseElement } = render_test_with_provider(
      <ReportModal
        entity_id={""}
        entity_type={"story"}
        open
        trigger={(): React.ReactElement => <button>test</button>}
      />
    );

    await wait_for(async () =>
      expect(await axe(baseElement)).toHaveNoViolations()
    );
  });
});
