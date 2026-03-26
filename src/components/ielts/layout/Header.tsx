"use client";

import React, { useState } from "react";
import Timer from "./Timer";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  userName: string;
  initialSeconds: number;
  activeTab: "LISTENING" | "READING" | "WRITING";
  onTabChange: (tab: "LISTENING" | "READING" | "WRITING") => void;
  onTimeExpire?: () => void;
  /** When true, section navigation buttons (Listening/Reading/Writing) are hidden; user cannot switch sections manually. */
  hideSectionTabs?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  userName,
  initialSeconds,
  activeTab,
  onTabChange,
  onTimeExpire,
  hideSectionTabs = false,
}) => {
  const [showTimer, setShowTimer] = useState(true);

  const sections: Array<{
    id: "LISTENING" | "READING" | "WRITING";
    label: string;
  }> = [
    { id: "LISTENING", label: "Listening" },
    { id: "READING", label: "Reading" },
    { id: "WRITING", label: "Writing" },
  ];

  return (
    <header className="h-[60px] bg-primary px-12 flex items-center justify-between shadow-xl z-50 fixed top-0 w-full border-b border-white/10">
      <div className="flex items-center space-x-2 min-w-[350px]">
        {!hideSectionTabs &&
          sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onTabChange(section.id)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-bold transition-all uppercase tracking-wider",
                activeTab === section.id
                  ? "bg-white text-primary shadow-md"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              {section.label}
            </button>
          ))}
      </div>

      <div className="flex-1 flex justify-center">
        {showTimer && (
          <Timer
            key={activeTab}
            initialSeconds={initialSeconds}
            onTimeExpire={onTimeExpire}
          />
        )}
      </div>

      <div className="flex items-center space-x-8 min-w-[300px] justify-end">
        <div className="flex items-center space-x-4 text-white">
          <span className="text-xs font-bold tracking-tight opacity-90">
            {userName}
          </span>
          <div className="w-[1px] h-4 bg-white/30" />
          <button
            onClick={() => setShowTimer(!showTimer)}
            className="text-[11px] font-black uppercase tracking-wider bg-white/10 hover:bg-white/20 px-3 py-1 rounded transition-colors"
          >
            {showTimer ? "Hide" : "Show"}
          </button>
        </div>
        <button className="text-white hover:bg-white/10 p-1.5 rounded-full transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Header;
