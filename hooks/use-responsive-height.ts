// hooks/useResponsiveHeight.ts
import { useEffect, useState } from "react";

export function useResponsiveHeight() {
  const [height, setHeight] = useState("50vh");

  useEffect(() => {
    const updateHeight = () => {
      if (window.innerWidth >= 1280) {
        setHeight("calc(100vh - 250px)");
      } else {
        setHeight("40vh");
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  return height;
}
