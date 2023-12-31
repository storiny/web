import React from "react";

import Link from "~/components/link";

import ErrorLayout from "../../(error)/layout";

const ERROR_CODE = 504;

const Error504Page = (): React.ReactElement => (
  <ErrorLayout
    description={
      <>
        Storiny is currently unavailable. Please try again later or check our{" "}
        {
          <Link
            href={process.env.NEXT_PUBLIC_STATUS_PAGE_URL || "/"}
            target={"_blank"}
            underline={"always"}
          >
            service status
          </Link>
        }{" "}
        for any updates.
      </>
    }
    error_code={`${ERROR_CODE}`}
    hide_footer
    title={"Gateway timeout"}
  />
);

export default Error504Page;
