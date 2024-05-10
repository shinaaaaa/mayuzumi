import React from "react";
import {RiLayoutRowLine, RiSettings3Line, RiZoomInLine, RiZoomOutLine,} from "react-icons/ri";

import UIButton from "./button";

type Props = {
  onClick: () => void;
};

const LeftButtons = ({onClick}: Props): JSX.Element => (

  <div className="flex items-center overflow-hidden">
    <UIButton title="設定" onClick={onClick}>
      <RiSettings3Line/>
    </UIButton>
    <UIButton title={"縮小"} onClick={() => window.api.zoomOut()}>
      <RiZoomOutLine/>
    </UIButton>
    <UIButton title={"縮小"} onClick={() => window.api.zoomIn()}>
      <RiZoomInLine />
    </UIButton>
    <UIButton title={"分割表示"} onClick={() => window.api.cycleSubScreenMode()}>
      <RiLayoutRowLine />
    </UIButton>
  </div>
);

export default LeftButtons;
