"use client";
import { useState, useEffect } from "react";

export function useWindowWidth(fallback = 1024) {
  const [width, setWidth] = useState(fallback);
  useEffect(() => {
    setWidth(window.innerWidth);
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}
