"use client";

import { useEffect } from "react";

type WorkspaceLaneResponse = {
  lane?: "admin" | "public" | "shelter";
  target?: string | null;
};

export default function AdminLaneGuard() {
  useEffect(() => {
    let disposed = false;
    let requestInFlight = false;

    async function enforceWorkspaceLane() {
      if (requestInFlight || disposed) return;
      requestInFlight = true;

      try {
        const response = await fetch("/api/workspace-lane", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (!response.ok || disposed) return;

        const result = await response.json() as WorkspaceLaneResponse;
        if (result.lane === "shelter") {
          window.location.replace(result.target?.startsWith("/shelter") ? result.target : "/shelter");
        }
      } finally {
        requestInFlight = false;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") void enforceWorkspaceLane();
    }

    void enforceWorkspaceLane();
    window.addEventListener("focus", enforceWorkspaceLane);
    window.addEventListener("pageshow", enforceWorkspaceLane);
    window.addEventListener("popstate", enforceWorkspaceLane);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      disposed = true;
      window.removeEventListener("focus", enforceWorkspaceLane);
      window.removeEventListener("pageshow", enforceWorkspaceLane);
      window.removeEventListener("popstate", enforceWorkspaceLane);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
