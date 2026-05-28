/**
 * Hardcoded list of proposal categories for v1. Edit this list to add or
 * rename categories. A proposal_categories admin table is deferred until
 * needed.
 */
export const PROPOSAL_CATEGORIES = [
  "Framing",
  "Electrical",
  "Plumbing",
  "HVAC",
  "Roofing",
  "Flooring",
  "Painting",
  "Landscaping",
  "Concrete",
  "Masonry / Brick",
  "Drywall",
  "Insulation",
  "Windows & Doors",
  "Cabinetry",
  "General Contracting",
  "Other",
] as const;

export type ProposalCategory = (typeof PROPOSAL_CATEGORIES)[number];
