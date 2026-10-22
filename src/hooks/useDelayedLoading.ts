import { useEffect, useState } from 'react';

/** Chỉ báo loading nếu tải lâu hơn `delayMs` — tránh loading chớp nhoáng khi mạng nhanh. */
export function useDelayedLoading(isLoading: boolean, delayMs = 300): boolean {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
      return;
    }
    const timer = setTimeout(() => setShowLoading(true), delayMs);
    return () => clearTimeout(timer);
  }, [isLoading, delayMs]);

  return showLoading;
}
