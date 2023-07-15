import "./Avatar.scss";

import React, { useState } from "react";

import { getNameInitial } from "../clients";

type AvatarProps = {
  color: string;
  name: string;
  onClick: (e: React.MouseEvent<HTMLDivLayer, MouseEvent>) => void;
  src?: string;
};

export const Avatar = ({ color, onClick, name, src }: AvatarProps) => {
  const shortName = getNameInitial(name);
  const [error, setError] = useState(false);
  const loadImg = !error && src;
  const style = loadImg ? undefined : { background: color };
  return (
    <div className="Avatar" onClick={onClick} style={style}>
      {loadImg ? (
        <img
          alt={shortName}
          className="Avatar-img"
          onError={() => setError(true)}
          referrerPolicy="no-referrer"
          src={src}
        />
      ) : (
        shortName
      )}
    </div>
  );
};
