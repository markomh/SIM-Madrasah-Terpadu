import { useState, useEffect } from "react";

/**
 * Hook untuk menunda (debounce) pembaruan nilai state.
 * Berguna untuk menunda eksekusi API fetch saat pengguna sedang mengetik.
 *
 * @param value Nilai yang ingin didelay
 * @param delay Waktu tunda dalam milidetik (ms)
 * @returns Nilai yang telah di-debounce
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set timer to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear timeout if value changes (user is still typing) or component unmounts
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
