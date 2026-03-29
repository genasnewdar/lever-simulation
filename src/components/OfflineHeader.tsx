import Link from "next/link";
import { auth0 } from "@/lib/auth0";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";
import { LogOut } from "lucide-react";

export const OfflineHeader = async () => {
  let user = null;
  try {
    const session = await auth0.getSession();
    user = session?.user ?? null;
  } catch {
    // Bad/expired session cookie — show login link
    user = null;
  }

  const logoutUrl = "/auth/logout?returnTo=/auth/login";

  return (
    <header className="w-full border-b border-bordercolor bg-white py-4 px-8 flex justify-between items-center fixed z-30 top-0 left-0 h-[72px]">
      {/* Left Side: User Menu (Picture + Name) */}
      <div className="flex items-center gap-4">
        {user && <UserMenu user={user} />}
      </div>

      {/* Right Side: Garah (Exit) Button */}
      <div className="flex items-center gap-4">
        {user ? (
          <Link href={logoutUrl}>
            <Button
              variant="ghost"
              className="text-textsecondary hover:text-destructive gap-2"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Exit</span>
            </Button>
          </Link>
        ) : (
          <Link href="/auth/login">
            <Button>Nevtreh</Button>
          </Link>
        )}
      </div>
    </header>
  );
};
