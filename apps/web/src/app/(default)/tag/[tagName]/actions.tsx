import NextLink from "next/link";
import React from "react";

import { GetTagResponse } from "~/common/grpc";
import IconButton from "~/components/IconButton";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import Separator from "~/components/Separator";
import { useClipboard } from "~/hooks/useClipboard";
import { useWebShare } from "~/hooks/useWebShare";
import CopyIcon from "~/icons/Copy";
import DotsIcon from "~/icons/Dots";
import ReportIcon from "~/icons/Report";
import ShareIcon from "~/icons/Share";

interface Props {
  tag: GetTagResponse;
}

const Actions = ({ tag }: Props): React.ReactElement => {
  const share = useWebShare();
  const copy = useClipboard();

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
        href={`/report?id=${tag.id}&type=tag`}
        rel={"noreferrer"}
        target={"_blank"}
      >
        Report this tag
      </MenuItem>
    </Menu>
  );
};

export default Actions;
