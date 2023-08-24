import clsx from "clsx";
import React from "react";

import IconButton from "~/components/IconButton";
import Option from "~/components/Option";
import Select from "~/components/Select";
import MusicIcon from "~/icons/Music";
import MuteIcon from "~/icons/Mute";
import PauseIcon from "~/icons/Pause";
import PlayIcon from "~/icons/Play";
import VolumeIcon from "~/icons/Volume";

import styles from "./music-item.module.scss";
import ToneArm from "./tone-arm";

const MusicItemContent = (): React.ReactElement => {
  const [playing, setPlaying] = React.useState<boolean>(false);
  const [muted, setMuted] = React.useState<boolean>(false);

  return (
    <React.Fragment>
      <div
        className={clsx("full-w", "flex-center", styles.x, styles.turntable)}
      >
        <div
          className={clsx(
            "flex",
            styles.x,
            styles.player,
            muted && styles.muted
          )}
          role={"presentation"}
        >
          <span
            className={clsx(styles.x, styles.record, playing && styles.playing)}
          />
          <ToneArm playing={playing} />
        </div>
        <div className={clsx("flex-col", styles.x, styles.actions)}>
          <IconButton
            aria-label={`${muted ? "Unmute" : "Mute"} track`}
            onClick={(): void => setMuted((prevState) => !prevState)}
            title={`${muted ? "Unmute" : "Mute"} track`}
            variant={"hollow"}
          >
            {muted ? <MuteIcon /> : <VolumeIcon />}
          </IconButton>
          <IconButton
            aria-label={`${playing ? "Pause" : "Play"} track`}
            onClick={(): void => setPlaying((prevState) => !prevState)}
            title={`${playing ? "Pause" : "Play"} track`}
            variant={playing ? "hollow" : "rigid"}
          >
            {playing ? <PauseIcon /> : <PlayIcon />}
          </IconButton>
        </div>
      </div>
      <Select
        defaultValue={"pick"}
        slotProps={{
          content: {
            style: {
              zIndex: "calc(var(--z-index-popover) + 1)"
            }
          },
          trigger: {
            "aria-label": "Pick a track",
            className: clsx("focus-invert", styles.x, styles["select-trigger"])
          },
          value: {
            placeholder: "Pick a track"
          }
        }}
      >
        <Option decorator={<MusicIcon />} value={"pick"}>
          Track genre
        </Option>
      </Select>
    </React.Fragment>
  );
};

export default MusicItemContent;
