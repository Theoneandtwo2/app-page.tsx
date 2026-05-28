import { getActiveProjects } from "@/lib/projects";
import { PROPOSAL_CATEGORIES } from "@/lib/proposal-categories";
import ProposalFormClient from "./ProposalFormClient";

export const dynamic = "force-dynamic";

export default async function SubmitProposalPage() {
  const projects = await getActiveProjects();
  return <ProposalFormClient projects={projects} categories={[...PROPOSAL_CATEGORIES]} />;
}
