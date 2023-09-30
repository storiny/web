"use client";

import { ASSET_PROPS, AssetRating, ImageSize } from "@storiny/shared";
import clsx from "clsx";
import { useAtom as use_atom } from "jotai";
import React from "react";

import AspectRatio from "~/components/aspect-ratio";
import { use_confirmation } from "~/components/confirmation";
import IconButton from "~/components/icon-button";
import Image from "~/components/image";
import Input from "~/components/input";
import Menu from "~/components/menu";
import MenuItem from "~/components/menu-item";
import { Description, use_modal } from "~/components/modal";
import ModalFooterButton from "~/components/modal/footer-button";
import Radio from "~/components/radio";
import RadioGroup from "~/components/radio-group";
import Spacer from "~/components/spacer";
import Tooltip from "~/components/tooltip";
import Typography from "~/components/typography";
import CheckIcon from "~/icons/check";
import DotsIcon from "~/icons/dots";
import EditIcon from "~/icons/edit";
import ExplicitIcon from "~/icons/explicit";
import StarIcon from "~/icons/star";
import TrashIcon from "~/icons/trash";
import {
  use_asset_alt_mutation,
  use_asset_rating_mutation,
  use_delete_asset_mutation,
  use_favourite_asset_mutation
} from "~/redux/features";
import { get_cdn_url } from "~/utils/get-cdn-url";

import { selected_atom } from "../../../atoms";
import common_styles from "../common.module.scss";
import styles from "./library-item.module.scss";
import { LibraryItemProps } from "./library-item.props";

const RATING_DISPLAY_NAME_MAP: Record<AssetRating, string> = {
  [AssetRating.SENSITIVE /*        */]: "Rated as sensitive",
  [AssetRating.SUGGESTIVE_NUDITY /**/]: "Rated as containing suggestive nudity",
  [AssetRating.VIOLENCE /*         */]: "Rated as violent",
  [AssetRating.NOT_RATED /*        */]: ""
};

// Rating modal

const RatingModal = ({
  rating,
  set_rating
}: {
  rating: AssetRating;
  set_rating: (next_value: AssetRating) => void;
}): React.ReactElement => (
  <React.Fragment>
    <Description asChild>
      <Typography className={"t-minor"} level={"body2"}>
        Assign a rating to this image to enable us to provide appropriate
        warning, helping people avoid the content they wish to abstain from.
      </Typography>
    </Description>
    <Spacer orientation={"vertical"} size={3} />
    <RadioGroup
      defaultValue={String(rating)}
      onValueChange={(next_value): void =>
        set_rating(Number.parseInt(next_value))
      }
    >
      <Radio label={"Not rated"} value={String(AssetRating.NOT_RATED)} />
      <Radio
        label={"Suggestive nudity"}
        value={String(AssetRating.SUGGESTIVE_NUDITY)}
      />
      <Radio label={"Violence"} value={String(AssetRating.VIOLENCE)} />
      <Radio label={"Sensitive"} value={String(AssetRating.SENSITIVE)} />
    </RadioGroup>
  </React.Fragment>
);

const LibraryMasonryItem = React.memo(
  ({ data }: LibraryItemProps): React.ReactElement => {
    const [selected, set_selected] = use_atom(selected_atom);
    const [editing_mode, set_editing_mode] = React.useState<boolean>(false);
    const [is_favourite, set_is_favourite] = React.useState<boolean>(
      data.favourite
    );
    const [alt_text, set_alt_text] = React.useState<string>(data.alt);
    const [rating, set_rating] = React.useState<AssetRating>(data.rating);
    const [deleted, set_deleted] = React.useState<boolean>(false);
    const [mutate_favourite_asset] = use_favourite_asset_mutation();
    const [mutate_asset_alt] = use_asset_alt_mutation();
    const [mutate_asset_rating] = use_asset_rating_mutation();
    const [delete_asset] = use_delete_asset_mutation();
    const is_selected = selected?.key === data.key;

    /**
     * Handles rating change
     */
    const on_rating_change = React.useCallback(
      (next_rating: AssetRating) => set_rating(next_rating),
      []
    );

    /**
     * Handles selection
     */
    const handle_select = (): void => {
      if (!deleted) {
        set_selected({
          src: get_cdn_url(data.key, ImageSize.W_320),
          alt: data.alt,
          key: data.key,
          hex: data.hex,
          rating: data.rating,
          width: data.width,
          height: data.height,
          source: "native"
        });
      }
    };

    /**
     * Handles rating
     */
    const handle_rating = React.useCallback(() => {
      mutate_asset_rating({ rating, id: data.id });
    }, [data.id, mutate_asset_rating, rating]);

    /**
     * Handles item deletion
     */
    const handle_delete = React.useCallback(() => {
      delete_asset({ id: data.id });
      set_deleted(true);

      // Reset selection
      if (is_selected) {
        set_selected(null);
      }
    }, [data.id, delete_asset, is_selected, set_selected]);

    /**
     * Marks the item as favourite
     */
    const handle_favourite = (): void => {
      mutate_favourite_asset({ id: data.id, value: !is_favourite });
      set_is_favourite((prev_state) => !prev_state);
    };

    /**
     * Handles the alt text
     */
    const handle_alt = (): void => {
      mutate_asset_alt({ id: data.id, alt: alt_text });
      set_editing_mode(false);
    };

    // Rating modal
    const [rating_element] = use_modal(
      ({ open_modal }) => (
        <MenuItem
          check_auth
          decorator={<ExplicitIcon />}
          onClick={open_modal}
          onSelect={(event): void => event.preventDefault()}
        >
          Edit rating
        </MenuItem>
      ),
      <RatingModal rating={rating} set_rating={on_rating_change} />,
      {
        footer: (
          <>
            <ModalFooterButton variant={"ghost"}>Cancel</ModalFooterButton>
            <ModalFooterButton onClick={handle_rating}>
              Confirm
            </ModalFooterButton>
          </>
        ),
        slot_props: {
          content: {
            style: {
              width: "360px",
              zIndex: "calc(var(--z-index-modal) + 2)"
            }
          },
          header: {
            decorator: <ExplicitIcon />,
            children: "Edit image rating"
          },
          overlay: {
            style: {
              zIndex: "calc(var(--z-index-modal) + 2)"
            }
          }
        }
      }
    );

    // Delete image modal
    const [delete_element] = use_confirmation(
      ({ open_confirmation }) => (
        <MenuItem
          check_auth
          decorator={<TrashIcon />}
          onSelect={(event): void => {
            event.preventDefault(); // Do not auto-close the menu
            open_confirmation();
          }}
        >
          Delete image
        </MenuItem>
      ),
      {
        color: "ruby",
        decorator: <TrashIcon />,
        on_confirm: handle_delete,
        title: "Delete image?",
        description: `The image will be permanently deleted and cannot be recovered. If this image is used in a story or profile, it will be replaced by a placeholder.`,
        slot_props: {
          content: {
            style: {
              zIndex: "calc(var(--z-index-modal) + 2)"
            }
          },
          overlay: {
            style: {
              zIndex: "calc(var(--z-index-modal) + 2)"
            }
          }
        }
      }
    );

    return (
      <div className={clsx("flex-col", styles.item, deleted && styles.deleted)}>
        <div
          className={clsx(
            "focusable",
            "flex-center",
            common_styles["image-wrapper"]
          )}
          data-selected={String(is_selected)}
          onClick={handle_select}
          onKeyUp={(event): void => {
            if (event.key === "Enter") {
              event.preventDefault();
              handle_select();
            }
          }}
          role={"button"}
          tabIndex={0}
        >
          {deleted && (
            <div
              aria-hidden
              className={clsx("flex-center", styles["deleted-overlay"])}
            >
              <TrashIcon />
            </div>
          )}
          <AspectRatio
            className={common_styles.image}
            ratio={data.width / data.height}
          >
            <Image
              alt={data.alt || ""}
              img_key={data.key}
              size={ImageSize.W_640}
              slot_props={{
                fallback: {
                  style: { display: "none" }
                }
              }}
            />
          </AspectRatio>
        </div>
        <Tooltip content={RATING_DISPLAY_NAME_MAP[rating]}>
          <span
            className={clsx(
              "flex-center",
              styles["explicit-button"],
              rating === AssetRating.NOT_RATED && styles.hidden
            )}
          >
            <ExplicitIcon />
          </span>
        </Tooltip>
        <Tooltip
          content={
            is_favourite ? "Remove from favourites" : "Add to favourites"
          }
        >
          <IconButton
            className={styles["favourite-button"]}
            onClick={handle_favourite}
            size={"xs"}
            variant={"ghost"}
          >
            <StarIcon no_stroke={is_favourite} />
          </IconButton>
        </Tooltip>
        {editing_mode ? (
          <Input
            autoFocus
            end_decorator={
              <IconButton
                aria-label={"Save alt text"}
                onClick={handle_alt}
                title={"Save alt text"}
              >
                <CheckIcon />
              </IconButton>
            }
            maxLength={ASSET_PROPS.alt.max_length}
            minLength={ASSET_PROPS.alt.min_length}
            onChange={(event): void => set_alt_text(event.target.value)}
            onKeyUp={(event): void => {
              // Save on enter
              if (event.key === "Enter") {
                event.preventDefault();
                handle_alt();
              }
            }}
            placeholder={"Alt text for the image"}
            size={"sm"}
            value={alt_text}
          />
        ) : (
          <div className={clsx("flex-center", styles.footer)}>
            <Typography
              className={clsx(
                alt_text.trim() ? "t-major" : "t-minor",
                styles["alt-text"],
                alt_text.trim() && styles.empty
              )}
              ellipsis
              level={"body3"}
              onClick={(): void => set_editing_mode(true)}
              title={alt_text || "Add an alt text"}
            >
              {alt_text.trim() ? alt_text : "Add an alt text"}
            </Typography>
            <Menu
              // Force close menu when deleted
              open={deleted ? false : undefined}
              slot_props={{
                content: {
                  style: {
                    zIndex: "calc(var(--z-index-modal) + 1)"
                  }
                }
              }}
              trigger={
                <IconButton
                  aria-label={"Asset options"}
                  size={"xs"}
                  title={"More options"}
                  variant={"ghost"}
                >
                  <DotsIcon />
                </IconButton>
              }
            >
              <MenuItem
                check_auth
                decorator={<EditIcon />}
                onClick={(): void => set_editing_mode(true)}
              >
                Edit alt text
              </MenuItem>
              {rating_element}
              {delete_element}
            </Menu>
          </div>
        )}
      </div>
    );
  }
);

LibraryMasonryItem.displayName = "LibraryMasonryItem";

export default LibraryMasonryItem;
