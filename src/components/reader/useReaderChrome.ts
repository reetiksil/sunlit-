import { useEffect } from "react";

/**
 * Marks <html> while a reader view is in distraction-free mode so global chrome
 * (site footer, ambient background) can be hidden from CSS without prop-drilling.
 */
export function useReaderChrome(active: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    if (active) root.setAttribute("data-reader-mode", "on");
    else root.removeAttribute("data-reader-mode");
    return () => root.removeAttribute("data-reader-mode");
  }, [active]);
}
