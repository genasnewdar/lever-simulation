"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-md">
      <WifiOff className="h-4 w-4" strokeWidth={2} aria-hidden />
      <span>Холболт алдагдсан. Хариултууд хадгалагдсан. Дахин холбогдож байна...</span>
    </div>
  );
}
