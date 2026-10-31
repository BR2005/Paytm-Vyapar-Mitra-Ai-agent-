import { useEffect, useState } from "react";

export function useCountUp(target, duration = 800, prefix = "", isCurrency = false) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const num = Number(target || 0);
    if (isNaN(num)) {
      setDisplayValue(0);
      return;
    }

    if (num === 0) {
      setDisplayValue(0);
      return;
    }

    let startTimestamp = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeProgress * num);
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setDisplayValue(num);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
    };
  }, [target, duration]);

  if (isCurrency) {
    return `${prefix}₹${displayValue.toLocaleString("en-IN")}`;
  }

  return `${prefix}${displayValue.toLocaleString("en-IN")}`;
}
