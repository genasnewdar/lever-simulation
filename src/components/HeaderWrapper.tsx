"use client";

import { usePathname } from "next/navigation";

export const HeaderWrapper = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // Show header only on home page ('/') or '/ielts'
  if (pathname !== "/ielts" && pathname !== "/") {
    return null;
  }

  return <>{children}</>;
};
