import { createClient } from "@supabase/supabase-js";

const FALLBACK_PROJECTS = [
  "2757 Nelson",
  "2767 Nelson",
  "6004 Balsam",
  "5914 Woodley",
];

/**
 * Fetch the list of active project addresses from Supabase. Used by the
 * invoice and proposal forms to populate the Project dropdown.
 *
 * Falls back to a hardcoded list if the table is unreachable or empty so
 * forms never break.
 */
export async function getActiveProjects(): Promise<string[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return FALLBACK_PROJECTS;

  try {
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase
      .from("projects")
      .select("project_name, is_active")
      .order("project_name", { ascending: true });

    if (error || !data || data.length === 0) return FALLBACK_PROJECTS;

    const active = data
      .filter((p: { project_name: string; is_active: boolean | null }) => p.is_active !== false)
      .map((p: { project_name: string }) => p.project_name)
      .filter(Boolean);

    return active.length > 0 ? active : FALLBACK_PROJECTS;
  } catch {
    return FALLBACK_PROJECTS;
  }
}
