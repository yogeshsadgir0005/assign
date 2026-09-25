import { useEffect, useState } from "react";

/** Holds a value still for `delay` ms so typing doesn't become one call per key. */
export function useDebouncedValue<T>(value: T, delay: number) {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
}
