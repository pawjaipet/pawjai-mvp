"use client";

import { useEffect, useState } from "react";
import ProtectedRouteGate from "@/components/auth/ProtectedRouteGate";
import { createClient } from "@/utils/supabase/client";

type ClientAuthGateProps = {
  children: React.ReactNode;
  nextPath: string;
  reason: string;
};

export default function ClientAuthGate({ children, nextPath, reason }: ClientAuthGateProps) {
  const [status, setStatus] = useState<"checking" | "signed-in" | "signed-out">("checking");

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setStatus(data.user ? "signed-in" : "signed-out");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session?.user ? "signed-in" : "signed-out");
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-[calc(100vh-70px)] items-center justify-center text-[#65584f]/50">
        Checking account...
      </div>
    );
  }

  if (status === "signed-out") {
    return <ProtectedRouteGate nextPath={nextPath} reason={reason} />;
  }

  return <>{children}</>;
}
