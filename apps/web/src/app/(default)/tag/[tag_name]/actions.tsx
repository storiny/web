import NextLink from "next/link";
import React from "react";

import { GetTagResponse } from "~/common/grpc";
import IconButton from "~/components/icon-button";
import Menu from "~/components/menu";
import MenuItem from "~/components/menu-item";
import Separator from "~/components/separator";
import { use_clipboard } from "~/hooks/use-clipboard";
import { use_web_share } from "~/hooks/use-web-share";
import CopyIcon from "~/icons/copy";
import DotsIcon from "~/icons/dots";
import ReportIcon from "~/icons/report";
import ShareIcon from "~/icons/share";

interface Props {
  tag: GetTagResponse;
}

const Actions = ({ tag }: Props): React.ReactElement => {
  const share = use_web_share();
  const copy = use_clipboard();

  return (
    <Menu
      trigger={
        <IconButton
          aria-label={"Tag options"}
          title={"Tag options"}
          variant={"ghost"}
        >
          <DotsIcon />
        </IconButton>
      }
    >
      <MenuItem
        decorator={<ShareIcon />}
        onClick={(): void =>
          share(tag.name, `${process.env.NEXT_PUBLIC_WEB_URL}/tag/${tag.name}`)
        }
      >
        Share this tag
      </MenuItem>
      <MenuItem
        decorator={<CopyIcon />}
        onClick={(): void =>
          copy(`${process.env.NEXT_PUBLIC_WEB_URL}/tag/${tag.name}`)
        }
      >
        Copy link to tag
      </MenuItem>
      <Separator />
      <MenuItem
        as={NextLink}
        decorator={<ReportIcon />}
        // TODO: Get rid of notion
        href={
          "https://storiny.notion.site/Report-an-issue-9193704afeb74ae09d2af3cf5eb844d6"
        }
        rel={"noreferrer"}
        target={"_blank"}
      >
        Report this tag
      </MenuItem>
    </Menu>
  );
};

export default Actions;
