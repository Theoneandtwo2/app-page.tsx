import { redirect } from "next/navigation";

/**
 * Legacy route from the earlier subcontractor-account direction.
 * Subcontractors do not have accounts in v1; this URL bounces to the public
 * homepage where they can re-submit or look up their tracking link.
 */
export default function LegacyMyInvoicesPage(): never {
  redirect("/");
}
