"use client";

import { DEFAULT_WPM, userProps } from "@storiny/shared";
import { clsx } from "clsx";
import React from "react";

import Button from "~/components/Button";
import Grow from "~/components/Grow";
import ScrollArea from "~/components/ScrollArea";
import Spacer from "~/components/Spacer";
import Typography from "~/components/Typography";
import { clamp } from "~/utils/clamp";

import { useAuthState } from "../../../actions";
import { useSignup } from "../../../useSignup";
import styles from "./styles.module.scss";

const WORD_COUNT = 262;

const Page = (): React.ReactElement => {
  const { actions } = useAuthState();
  const { handleSignup, isLoading } = useSignup();
  const [mountTime, setMountTime] = React.useState<number | null>(null);

  React.useEffect(() => setMountTime(new Date().getTime()), []);

  const onDone = (): void => {
    const minutes = (new Date().getTime() - (mountTime || 0)) / 60_000;
    const wpm = clamp(
      userProps.wpm.min,
      Math.floor(WORD_COUNT / minutes) || DEFAULT_WPM,
      userProps.wpm.max
    );

    actions.setSignupState({ wpm });
    handleSignup();
  };

  return (
    <>
      <Typography as={"h1"} level={"h3"}>
        Reading speed test
      </Typography>
      <Spacer orientation={"vertical"} size={0.5} />
      <Typography className={"t-minor"} level={"body2"}>
        Click on &quot;Done&quot; when you have finished reading the text
        presented in the box below.
      </Typography>
      <Spacer orientation={"vertical"} size={5} />
      <ScrollArea
        as={"article"}
        className={clsx(styles.x, styles["scroll-area"])}
        slotProps={{
          viewport: {
            className: clsx(styles.x, styles.viewport)
          }
        }}
        type={"auto"}
      >
        <Typography className={"t-legible-slim"} level={"legible"}>
          It did not terrify Cantrell to know he was up so high and going so
          fast, going higher and faster than any human before him. He would be
          up even higher the next day, he remembered, going so high and so fast
          he would not come down again.
          <br />
          <br />
          It would be a shame to leave Earth, he knew. Up here there was
          emptiness all around. Emptiness and, except for the dull throb of the
          rocket engines, silence. Out there—he looked up—there would be a
          greater emptiness, a greater silence, an infinity of nothingness in
          all directions.
          <br />
          <br />
          He felt suddenly cold at the thought, and then shame swept over him,
          forcing the paralysis aside. Fear of the unknown again, he thought
          distastefully. No matter how much the psychologists tried, they could
          not erase that icy prickling sensation that came with its
          contemplation. They were all children when it came to space, kids
          frightened by the dark alleys of the universe, fearing the bogey man
          that waited lurking in the velvet depths through which no one had
          passed before.
          <br />
          <br />
          With swift precision he pressed studs on the control panel before him,
          and a bank of jets on the side of his rocket flared into sudden life,
          pushing, turning, pulsing flame into the thin air of the outside. His
          gyro-chair made an effortless compensation for the altered direction.
          The ship banked, leveled, then leaped forward on a new course.
          Cantrell smiled. He could handle the ship now as though it were a part
          of him. On the big leap he expected no trouble.
        </Typography>
      </ScrollArea>
      <Spacer orientation={"vertical"} size={5} />
      <Grow />
      <div className={"flex-center"}>
        <Button
          className={"full-w"}
          disabled={mountTime === null}
          loading={isLoading}
          onClick={onDone}
          size={"lg"}
        >
          Done
        </Button>
      </div>
    </>
  );
};

export default Page;
