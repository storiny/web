import React from "react";

import { render_test_with_provider } from "~/redux/test-utils";

import LegalToc from "./toc";

describe("<LegalToc />", () => {
  it("matches snapshot", () => {
    const { container } = render_test_with_provider(
      <div>
        <article>
          <h2 id={"h2-1"}>H2</h2>
          <h3 id={"h3-1"}>H3</h3>
        </article>
        <LegalToc />
      </div>
    );

    expect(container.firstChild).toMatchSnapshot();
  });
});
