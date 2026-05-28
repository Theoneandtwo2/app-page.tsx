import { redirect } from "next/navigation";

/**
 * Legacy route from the earlier subcontractor-login direction.
 * Subcontractors no longer have accounts. Anyone hitting /login is bounced
 * to the public homepage. Admins use /admin-login.
 */
export default function LegacyLoginPage(): never {
  redirect("/");
}
