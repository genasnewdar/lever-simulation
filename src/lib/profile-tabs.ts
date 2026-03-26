import { createSerializer, parseAsStringLiteral } from "nuqs/server";

export const PROFILE_TAB_KEYS = [
  "info",
  "dashboard",
  "courses",
  "tests",
  "certificates",
  "rewards",
  "orders",
] as const;

export type ProfileTabKey = (typeof PROFILE_TAB_KEYS)[number];

// ✅ URL parser (алдаатай tab ирвэл default = info болно)
export const profileTabParser =
  parseAsStringLiteral(PROFILE_TAB_KEYS).withDefault("info");

// ✅ /my-profile?tab=orders гэх мэт линк үүсгэх type-safe helper
const serialize = createSerializer({ tab: profileTabParser });

export function profileHref(tab: ProfileTabKey = "info") {
  const qs = serialize({ tab }); // "tab=orders"
  return `/my-profile${qs}`;
}
