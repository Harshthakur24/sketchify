import { useEffect, useState } from "react";

export default function useDimension() {
  const [dimension, setDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      setDimension({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: dpr
      });
    };
    handleResize(); // Call once to initialize
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return dimension;
}
