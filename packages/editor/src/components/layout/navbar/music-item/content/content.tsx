import clsx from "clsx";
import React from "react";
import { useGlobalAudioPlayer as use_audio_player } from "react-use-audio-player";
import { useFilePicker as use_file_picker } from "use-file-picker";

import IconButton from "~/components/icon-button";
import Select from "~/components/select";
import { use_toast } from "~/components/toast";
import Toggle from "~/components/toggle";
import Tooltip from "~/components/tooltip";
import LoopIcon from "~/icons/loop";
import PauseIcon from "~/icons/pause";
import PlayIcon from "~/icons/play";

import styles from "./content.module.scss";
import ToneArm from "./tone-arm";

const MusicItemContent = (): React.ReactElement => {
  const toast = use_toast();
  const {
    src,
    load,
    loop,
    fade,
    playing,
    togglePlayPause: toggle_play_pause,
    looping
  } = use_audio_player();
  const [open_file_selector] = use_file_picker({
    /* eslint-disable prefer-snakecase/prefer-snakecase */
    readAs: "ArrayBuffer",
    accept: ["audio/*", "video/*"],
    multiple: false,
    limitFilesConfig: { max: 1, min: 1 },
    /* eslint-enable prefer-snakecase/prefer-snakecase */
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    onFilesRejected: () => {
      toast("Unable to import the audio file", "error");
    },
    // eslint-disable-next-line prefer-snakecase/prefer-snakecase
    onFilesSuccessfulySelected: ({ plainFiles: plain_files }) => {
      if (plain_files[0]) {
        const file = plain_files[0];
        const type = file.type.split("/")[1];
        const url = URL.createObjectURL(file);

        try {
          load(url, {
            autoplay: true,
            html5: true,
            // eslint-disable-next-line prefer-snakecase/prefer-snakecase
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
            onClick={open_file_selector}
            role={"button"}
            title={src ? "Change track" : "Pick a track"}
          />
          <ToneArm playing={playing} />
        </div>
        <div className={clsx("flex-col", styles.x, styles.actions)}>
          <Toggle
            aria-label={`${looping ? "Unloop" : "Loop"} track`}
            disabled={!src}
            onPressedChange={(next_pressed): void => loop(next_pressed)}
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
                open_file_selector();
              } else {
                toggle_play_pause();
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
