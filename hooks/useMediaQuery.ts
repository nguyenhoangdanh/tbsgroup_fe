// src/hooks/useMediaQuery.ts
import { useState, useEffect } from "react";

/**
 * Custom hook for responsive design that watches a media query
 * @param query The media query to watch
 * @returns Boolean indicating if the media query matches
 * 
 * @example
 * // Check if screen is mobile size
 * const isMobile = useMediaQuery("(max-width: 768px)");
 * 
 * // Check if user prefers dark mode
 * const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with the current match state if possible, otherwise false until client-side
  const getMatches = (): boolean => {
    // Check if window is defined (so the hook works on SSR)
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(getMatches());

  useEffect(() => {
    // Define function to handle match changes
    const handleChange = () => {
      setMatches(getMatches());
    };

    // Create media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    handleChange();

    // Add event listener using the modern approach if available, otherwise fallback
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // For older browsers
      mediaQuery.addListener(handleChange);
    }

    // Clean up
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        // For older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

export default useMediaQuery;





















// "use client"

// import { useState, useEffect } from 'react';

// /**
//  * Hook để phát hiện media query một cách chính xác
//  * @param query Media query string (e.g. "(max-width: 768px)")
//  * @returns boolean indicating if the query matches
//  */
// export function useMediaQuery(query: string): boolean {
//   // Kiểm tra nếu đang ở phía server hoặc window không tồn tại
//   const isServer = typeof window === 'undefined';
  
//   // Giá trị mặc định cho server-side rendering
//   const [matches, setMatches] = useState(() => {
//     // Server-side always returns false to avoid hydration mismatch
//     if (isServer) return false;
    
//     // Check initial value for client-side
//     return window.matchMedia(query).matches;
//   });

//   useEffect(() => {
//     if (isServer) return;
    
//     const media = window.matchMedia(query);
    
//     // Set initial value
//     setMatches(media.matches);
    
//     // Define listener function
//     const listener = (event: MediaQueryListEvent) => {
//       setMatches(event.matches);
//     };

//     // Add listener
//     media.addEventListener('change', listener);
    
//     // Cleanup
//     return () => media.removeEventListener('change', listener);
//   }, [query, isServer]);

//   return matches;
// }

// export default useMediaQuery;