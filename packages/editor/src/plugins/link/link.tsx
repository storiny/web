import { LinkPlugin as LexicalLinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import React from "react";

import { validateUrl } from "../../utils/sanitizeUrl";

const LinkPlugin = (): React.ReactElement => (
  <LexicalLinkPlugin validateUrl={validateUrl} />
);

export default LinkPlugin;
