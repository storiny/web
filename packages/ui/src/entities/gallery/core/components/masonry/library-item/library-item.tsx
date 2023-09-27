"use client";

import { assetProps, AssetRating, ImageSize } from "@storiny/shared";
import clsx from "clsx";
import { useAtom } from "jotai";
import React from "react";

import AspectRatio from "~/components/AspectRatio";
import { useConfirmation } from "~/components/Confirmation";
import IconButton from "~/components/IconButton";
import Image from "~/components/Image";
import Input from "~/components/Input";
import Menu from "~/components/Menu";
import MenuItem from "~/components/MenuItem";
import { Description, useModal } from "~/components/Modal";
import ModalFooterButton from "~/components/Modal/FooterButton";
import Radio from "~/components/Radio";
import RadioGroup from "~/components/RadioGroup";
import Spacer from "~/components/Spacer";
import Tooltip from "~/components/Tooltip";
import Typography from "~/components/Typography";
import CheckIcon from "~/icons/Check";
import DotsIcon from "~/icons/Dots";
import EditIcon from "~/icons/Edit";
import ExplicitIcon from "~/icons/Explicit";
import StarIcon from "~/icons/Star";
import TrashIcon from "~/icons/Trash";
import {
  use_asset_alt_mutation,
  use_delete_asset_mutation,
  use_asset_rating_mutation,
  use_favourite_asset_mutation
} from "~/redux/features";
import { getCdnUrl } from "~/utils/getCdnUrl";

import { selectedAtom } from "../../../atoms";
import commonStyles from "../common.module.scss";
import styles from "./library-item.module.scss";
import { LibraryItemProps } from "./library-item.props";

const ratingToDisplayNameMap: Record<AssetRating, string> = {
  [AssetRating.SENSITIVE /*        */]: "Rated as sensitive",
  [AssetRating.SUGGESTIVE_NUDITY /**/]: "Rated as containing suggestive nudity",
  [AssetRating.VIOLENCE /*         */]: "Rated as violent",
  [AssetRating.NOT_RATED /*        */]: ""
};

// Rating modal

const RatingModal = ({
  rating,
  setRating
}: {
  rating: AssetRating;
  setRating: (newValue: AssetRating) => void;
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
      onValueChange={(newValue): void => setRating(Number.parseInt(newValue))}
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
    const [selected, setSelected] = useAtom(selectedAtom);
    const [editingMode, setEditingMode] = React.useState<boolean>(false);
    const [isFavourite, setIsFavourite] = React.useState<boolean>(
      data.favourite
    );
    const [altText, setAltText] = React.useState<string>(data.alt);
    const [rating, setRating] = React.useState<AssetRating>(data.rating);
    const [deleted, setDeleted] = React.useState<boolean>(false);
    const [mutateFavouriteAsset] = use_favourite_asset_mutation();
    const [mutateAssetAlt] = use_asset_alt_mutation();
    const [mutateAssetRating] = use_asset_rating_mutation();
    const [deleteAsset] = use_delete_asset_mutation();
    const isSelected = selected?.key === data.key;

    /**
     * Handles rating change
     */
    const onRatingChange = React.useCallback(
      (newRating: AssetRating) => setRating(newRating),
      []
    );

    /**
     * Handles selection
     */
    const handleSelect = (): void => {
      if (!deleted) {
        setSelected({
          src: getCdnUrl(data.key, ImageSize.W_320),
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
    const handleRating = React.useCallback(() => {
      mutateAssetRating({ rating, id: data.id });
    }, [data.id, mutateAssetRating, rating]);

    /**
     * Handles item deletion
     */
    const handleDelete = React.useCallback(() => {
      deleteAsset({ id: data.id });
      setDeleted(true);

      // Reset selection
      if (isSelected) {
        setSelected(null);
      }
    }, [data.id, deleteAsset, isSelected, setSelected]);

    /**
     * Marks the item as favourite
     */
    const handleFavourite = (): void => {
      mutateFavouriteAsset({ id: data.id, value: !isFavourite });
      setIsFavourite((prevState) => !prevState);
    };

    /**
     * Handles the alt text
     */
    const handleAlt = (): void => {
      mutateAssetAlt({ id: data.id, alt: altText });
      setEditingMode(false);
    };

    // Rating modal
    const [ratingElement] = useModal(
      ({ openModal }) => (
        <MenuItem
          checkAuth
          decorator={<ExplicitIcon />}
          onClick={openModal}
          onSelect={(event): void => event.preventDefault()}
        >
          Edit rating
        </MenuItem>
      ),
      <RatingModal rating={rating} setRating={onRatingChange} />,
      {
        footer: (
          <>
            <ModalFooterButton variant={"ghost"}>Cancel</ModalFooterButton>
            <ModalFooterButton onClick={handleRating}>
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
    const [deleteElement] = useConfirmation(
      ({ openConfirmation }) => (
        <MenuItem
          checkAuth
          decorator={<TrashIcon />}
          onSelect={(event): void => {
            event.preventDefault(); // Do not auto-close the menu
            openConfirmation();
          }}
        >
          Delete image
        </MenuItem>
      ),
      {
        color: "ruby",
        decorator: <TrashIcon />,
        onConfirm: handleDelete,
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
            commonStyles["image-wrapper"]
          )}
          data-selected={String(isSelected)}
          onClick={handleSelect}
          onKeyUp={(event): void => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSelect();
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
            className={commonStyles.image}
            ratio={data.width / data.height}
          >
            <Image
              alt={data.alt || ""}
              imgId={data.key}
              size={ImageSize.W_640}
              slot_props={{
                fallback: {
                  style: { display: "none" }
                }
              }}
            />
          </AspectRatio>
        </div>
        <Tooltip content={ratingToDisplayNameMap[rating]}>
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
          content={isFavourite ? "Remove from favourites" : "Add to favourites"}
        >
          <IconButton
            className={styles["favourite-button"]}
            onClick={handleFavourite}
            size={"xs"}
            variant={"ghost"}
          >
            <StarIcon noStroke={isFavourite} />
          </IconButton>
        </Tooltip>
        {editingMode ? (
          <Input
            autoFocus
            endDecorator={
              <IconButton
                aria-label={"Save alt text"}
                onClick={handleAlt}
                title={"Save alt text"}
              >
                <CheckIcon />
              </IconButton>
            }
            maxLength={assetProps.alt.maxLength}
            minLength={assetProps.alt.minLength}
            onChange={(event): void => setAltText(event.target.value)}
            onKeyUp={(event): void => {
              // Save on enter
              if (event.key === "Enter") {
                event.preventDefault();
                handleAlt();
              }
            }}
            placeholder={"Alt text for the image"}
            size={"sm"}
            value={altText}
          />
        ) : (
          <div className={clsx("flex-center", styles.footer)}>
            <Typography
              className={clsx(
                altText.trim() ? "t-major" : "t-minor",
                styles["alt-text"],
                altText.trim() && styles.empty
              )}
              ellipsis
              level={"body3"}
              onClick={(): void => setEditingMode(true)}
              title={altText || "Add an alt text"}
            >
              {altText.trim() ? altText : "Add an alt text"}
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
                checkAuth
                decorator={<EditIcon />}
                onClick={(): void => setEditingMode(true)}
              >
                Edit alt text
              </MenuItem>
              {ratingElement}
              {deleteElement}
            </Menu>
          </div>
        )}
      </div>
    );
  }
);

LibraryMasonryItem.displayName = "LibraryMasonryItem";

export default LibraryMasonryItem;
