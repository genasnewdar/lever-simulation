// // app/auth/login/page.tsx
// import { redirect } from "next/navigation";

// export default function LoginPage() {
//   const audience = process.env.AUTH0_AUDIENCE;
//   const scope = "openid profile email read:shows";

//   redirect(
//     `/api/auth/login?audience=${audience}&scope=${encodeURIComponent(scope)}`
//   );
// }

// app/auth/login.tsx
"use client";
import { useEffect } from "react";

export default function LoginPage() {
  useEffect(() => {
    const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;
    const scope = "openid profile email read:shows";
    window.location.href = `/api/auth/login?audience=${audience}&scope=${encodeURIComponent(
      scope
    )}`;
  }, []);

  return <div>Redirecting to login...</div>;
}
