"use client"

import { useState, useEffect } from 'react';

/**
 * Hook để phát hiện media query một cách chính xác
 * @param query Media query string (e.g. "(max-width: 768px)")
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  // Kiểm tra nếu đang ở phía server hoặc window không tồn tại
  const isServer = typeof window === 'undefined';
  
  // Giá trị mặc định cho server-side rendering
  const [matches, setMatches] = useState(() => {
    // Server-side always returns false to avoid hydration mismatch
    if (isServer) return false;
    
    // Check initial value for client-side
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (isServer) return;
    
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);
    
    // Define listener function
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    media.addEventListener('change', listener);
    
    // Cleanup
    return () => media.removeEventListener('change', listener);
  }, [query, isServer]);

  return matches;
}

export default useMediaQuery;