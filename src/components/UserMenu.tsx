"use client";

import React from "react";

type User = { picture?: string; name?: string };

type UserProps = {
  user: User;
};

export const UserMenu = ({ user }: UserProps) => {
  if (!user) return null;

  return (
    <div className="flex items-center gap-2 p-1 rounded-lg">
      <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#F973161A]">
        {user.picture && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.picture}
            alt={user.name || "User"}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <p className="text-[#27272A] hidden md:block text-sm font-semibold max-w-[150px] truncate">
        {user.name}
      </p>
    </div>
  );
};
