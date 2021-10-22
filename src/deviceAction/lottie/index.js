import React from "react";
import Lottie from "react-lottie";

const Animation = ({
  animation,
  width = "100%",
  height = "100%",
  loop = true,
  autoplay = true,
  rendererSettings = { preserveAspectRatio: "xMidYMin" },
  isStopped = false,
}) => (
  <Lottie
    isClickToPauseDisabled
    ariaRole="animation"
    height={height}
    width={width}
    isStopped={isStopped}
    options={{
      loop: process.env.SPECTRON_RUN ? false : loop,
      autoplay: process.env.SPECTRON_RUN ? false : autoplay,
      animationData: animation,
      rendererSettings,
    }}
  />
);

export default Animation;
