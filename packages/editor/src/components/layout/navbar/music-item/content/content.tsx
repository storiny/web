import clsx from "clsx";
import React from "react";
import { useGlobalAudioPlayer } from "react-use-audio-player";
import { useFilePicker } from "use-file-picker";

import IconButton from "../../../../../../../ui/src/components/icon-button";
import Select from "../../../../../../../ui/src/components/select";
import { use_toast } from "../../../../../../../ui/src/components/toast";
import Toggle from "../../../../../../../ui/src/components/toggle";
import Tooltip from "../../../../../../../ui/src/components/tooltip";
import LoopIcon from "~/icons/Loop";
import PauseIcon from "~/icons/Pause";
import PlayIcon from "~/icons/Play";

import styles from "./content.module.scss";
import ToneArm from "./tone-arm";

const MusicItemContent = (): React.ReactElement => {
  const toast = use_toast();
  const { src, load, loop, fade, playing, togglePlayPause, looping } =
    useGlobalAudioPlayer();

  const [openFileSelector] = useFilePicker({
    readAs: "ArrayBuffer",
    accept: ["audio/*", "video/*"],
    multiple: false,
    limitFilesConfig: { max: 1, min: 1 },
    onFilesRejected: () => {
      toast("Unable to import the audio file", "error");
    },
    onFilesSuccessfulySelected: ({ plainFiles }) => {
      if (plainFiles[0]) {
        const file = plainFiles[0];
        const type = file.type.split("/")[1];
        const url = URL.createObjectURL(file);

        try {
          load(url, {
            autoplay: true,
            html5: true,
            initialVolume: 0,
            format: type,
            onplay: () => {
              fade(0, 1, 250);
            },
            onload: () => URL.revokeObjectURL(url)
          });
        } catch {
          toast("Unable to play your audio file", "error");
        }
      } else {
        toast("No audio file selected", "error");
      }
    }
  });

  return (
    <React.Fragment>
      <div
        className={clsx("full-w", "flex-center", styles.x, styles.turntable)}
      >
        <div className={clsx("flex", styles.x, styles.player)}>
          <span
            aria-label={src ? "Change track" : "Pick a track"}
            className={clsx(
              "force-animation",
              styles.x,
              styles.record,
              playing && styles.playing
            )}
            onClick={openFileSelector}
            role={"button"}
            title={src ? "Change track" : "Pick a track"}
          />
          <ToneArm playing={playing} />
        </div>
        <div className={clsx("flex-col", styles.x, styles.actions)}>
          <Toggle
            aria-label={`${looping ? "Unloop" : "Loop"} track`}
            disabled={!src}
            onPressedChange={(newPressed): void => loop(newPressed)}
            pressed={looping}
            title={`${looping ? "Unloop" : "Loop"} track`}
          >
            <LoopIcon />
          </Toggle>
          <IconButton
            aria-label={
              src ? `${playing ? "Pause" : "Play"} track` : "Pick a track"
            }
            onClick={(): void => {
              if (!src) {
                openFileSelector();
              } else {
                togglePlayPause();
              }
            }}
            title={src ? `${playing ? "Pause" : "Play"} track` : "Pick a track"}
            variant={playing ? "hollow" : "rigid"}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </IconButton>
        </div>
      </div>
      <Tooltip content={"Available soon"}>
        <div className={clsx("full-w", "flex-center")}>
          <Select
            disabled
            slot_props={{
              content: {
                style: {
                  zIndex: "calc(var(--z-index-popover) + 1)"
                }
              },
              trigger: {
                "aria-label": "Presets",
                className: "f-grow"
              },
              value: {
                placeholder: "Presets"
              }
            }}
          />
        </div>
      </Tooltip>
    </React.Fragment>
  );
};

export default MusicItemContent;
