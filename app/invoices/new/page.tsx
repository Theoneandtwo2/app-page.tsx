import { getActiveProjects } from "@/lib/projects";
import InvoiceFormClient from "./InvoiceFormClient";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
  const projects = await getActiveProjects();
  return <InvoiceFormClient projects={projects} />;
}
