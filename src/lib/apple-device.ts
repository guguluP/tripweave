import { useEffect, useState } from "react";

/** iPhone, iPad, iPod, and Mac. iPadOS often reports itself as a Mac with a touch screen. */
export function isAppleDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod|Macintosh|Mac OS X/.test(ua) || touchMac;
}

export function useAppleDevice() {
  const [apple, setApple] = useState(false);
  useEffect(() => {
    setApple(isAppleDevice());
  }, []);
  return apple;
}
