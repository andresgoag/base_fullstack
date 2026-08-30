import { useEffect, useState } from "react";

export const useDebouncedValue = <Value>(
  value: Value,
  delayMs: number,
): Value => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    return () => {
      clearTimeout(timeout);
    };
  }, [value, delayMs]);

  return debouncedValue;
};
