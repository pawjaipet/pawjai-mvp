"use client";

import { useEffect } from "react";
import { installReliabilityListeners } from "@/utils/reliability-client";

export default function ReliabilityMonitor() {
  useEffect(() => { installReliabilityListeners(); }, []);
  return null;
}
