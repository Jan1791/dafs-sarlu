"use client";

import type { ComponentProps } from "react";

export function ExclusiveVideo(props: ComponentProps<"video">) {
  return <video {...props} onPlay={(event) => {
    props.onPlay?.(event);
    for (const otherVideo of document.querySelectorAll("video")) {
      if (otherVideo !== event.currentTarget && !otherVideo.paused) otherVideo.pause();
    }
  }} />;
}
