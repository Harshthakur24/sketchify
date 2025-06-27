import { useEffect, useState } from "react";

export default function useDimension() {
  const [dimension, setDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: window.devicePixelRatio || 1
  });

  useEffect(() => {
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Only update if dimensions have changed significantly
      if (
        Math.abs(dimension.width - width) > 1 ||
        Math.abs(dimension.height - height) > 1 ||
        Math.abs(dimension.dpr - dpr) > 0.1
      ) {
        setDimension({
          width,
          height,
          dpr
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [dimension]);

  return dimension;
}
