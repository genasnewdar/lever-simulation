"use client";

import React from "react";
import Timer from "./Timer";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import type { SectionTab } from "@/types/ielts-simulation";

interface HeaderProps {
  userName: string;
  initialSeconds: number;
  activeTab: SectionTab;
  onTabChange: (tab: SectionTab) => void;
  onTimeExpire?: () => void;
  hideSectionTabs?: boolean;
  controlledSeconds?: number;
  onDevFinish?: () => void;
}

const sections: Array<{
  id: SectionTab;
  label: string;
}> = [
  { id: "LISTENING", label: "Listening" },
  { id: "READING", label: "Reading" },
  { id: "WRITING", label: "Writing" },
];

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1");

const Header: React.FC<HeaderProps> = ({
  userName,
  initialSeconds,
  activeTab,
  onTabChange,
  onTimeExpire,
  hideSectionTabs = false,
  controlledSeconds,
  onDevFinish,
}) => {
  return (
    <header className="h-[64px] bg-paper px-8 flex items-center justify-between fixed top-0 w-full z-50 border-b border-rule">
      <div className="flex items-center gap-6 min-w-[360px]">
        <Logo size={36} />
        {!hideSectionTabs && (
          <nav className="flex items-center gap-1" aria-label="Exam sections">
            {sections.map((section) => {
              const active = activeTab === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => onTabChange(section.id)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative px-3 py-1.5 text-[13px] font-semibold tracking-tight transition-colors",
                    active
                      ? "text-ink"
                      : "text-muted hover:text-ink-soft",
                  )}
                >
                  {section.label}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute left-3 right-3 -bottom-[19px] h-[2px] rounded-full transition-all",
                      active
                        ? "bg-mint opacity-100"
                        : "bg-transparent opacity-0",
                    )}
                  />
                </button>
              );
            })}
          </nav>
        )}
      </div>

      <div className="flex-1 flex justify-center">
        <Timer
          key={activeTab}
          initialSeconds={initialSeconds}
          onTimeExpire={onTimeExpire}
          controlledSeconds={controlledSeconds}
        />
      </div>

      <div className="flex items-center gap-5 min-w-[300px] justify-end">
        <span className="text-[13px] font-medium text-ink-soft tracking-tight">
          {userName}
        </span>
        {isLocalhost && onDevFinish && (
          <button
            onClick={onDevFinish}
            className="px-2.5 py-1 rounded-md border border-rose-300 bg-rose-50 text-rose-600 text-xs font-semibold tracking-tight hover:bg-rose-100 transition-colors"
          >
            Finish section
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
