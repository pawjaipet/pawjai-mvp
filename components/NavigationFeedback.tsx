"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

function isPlainInternalNavigation(event: MouseEvent, anchor: HTMLAnchorElement) {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download")) return false;

  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;

  const target = new URL(anchor.href, window.location.href);
  if (target.origin !== window.location.origin) return false;

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const targetPath = `${target.pathname}${target.search}`;
  return targetPath !== currentPath;
}

export default function NavigationFeedback() {
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setPending(false);
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [pathname]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (!isPlainInternalNavigation(event, target)) return;

      setPending(true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setPending(false), 4500);
    }

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!pending) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center">
      <div className="relative w-full max-w-[402px]">
        <div className="h-[3px] overflow-hidden bg-[#f1d5d8]">
          <div className="h-full w-1/2 animate-[pawjai-route-progress_1.05s_ease-in-out_infinite] rounded-full bg-[#cd8188]" />
        </div>
        <style>{`
          @keyframes pawjai-route-progress {
            0% { transform: translateX(-120%); }
            55% { transform: translateX(90%); }
            100% { transform: translateX(220%); }
          }
        `}</style>
      </div>
    </div>
  );
}
