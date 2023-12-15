import React from "react";

import { GetTagResponse } from "~/common/grpc";
import IconButton from "~/components/icon-button";
import Menu from "~/components/menu";
import MenuItem from "~/components/menu-item";
import Separator from "~/components/separator";
import { use_toast } from "~/components/toast";
import ReportModal from "~/entities/report-modal";
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
  const toast = use_toast();
  const share = use_web_share(toast);
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
      <ReportModal
        entity_id={tag.id}
        entity_type={"tag"}
        trigger={({ open_modal }): React.ReactElement => (
          <MenuItem
            decorator={<ReportIcon />}
            onClick={open_modal}
            onSelect={(event): void => event.preventDefault()}
          >
            Report this tag
          </MenuItem>
        )}
      />
    </Menu>
  );
};

export default Actions;
