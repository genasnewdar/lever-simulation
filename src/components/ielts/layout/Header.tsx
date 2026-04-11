"use client";

import React from "react";
import Image from "next/image";
import Timer from "./Timer";
import { HelpCircle, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  userName: string;
  initialSeconds: number;
  activeTab: "LISTENING" | "READING" | "WRITING";
  onTabChange: (tab: "LISTENING" | "READING" | "WRITING") => void;
  onTimeExpire?: () => void;
  /** When true, section navigation buttons (Listening/Reading/Writing) are hidden; user cannot switch sections manually. */
  hideSectionTabs?: boolean;
  onReviewClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  userName,
  initialSeconds,
  activeTab,
  onTabChange,
  onTimeExpire,
  hideSectionTabs = false,
  onReviewClick,
}) => {
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
      <div className="flex items-center space-x-4 min-w-[350px]">
        <Image
          src="/logo.png"
          alt="Lever Edu"
          width={40}
          height={40}
          className="rounded-lg"
        />
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
        <Timer
          key={activeTab}
          initialSeconds={initialSeconds}
          onTimeExpire={onTimeExpire}
        />
      </div>

      <div className="flex items-center space-x-8 min-w-[300px] justify-end">
        <span className="text-xs font-bold tracking-tight text-white opacity-90">
          {userName}
        </span>
        {onReviewClick && (
          <button
            onClick={onReviewClick}
            className="flex items-center gap-1.5 text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ClipboardList className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Review</span>
          </button>
        )}
        <button className="text-white hover:bg-white/10 p-1.5 rounded-full transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

export default Header;
