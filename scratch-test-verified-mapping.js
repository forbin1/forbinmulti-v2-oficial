import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wuarslrenynwiflzgrjp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1YXJzbHJlbnlud2lmbHpncmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM0MzUxNSwiZXhwIjoyMDkzOTE5NTE1fQ.ik_1FgpXRk7L0vIigcQuJopin3592cjsicQ9aEDNvEE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, city, state, contract_type, modality, salary_min, salary_max, requirements, banner_url, created_at, companies(company_name, logo_url, username), applications(count)")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Query Error:", error);
    return;
  }

  const mapped = data.map((j) => {
    const company = j.companies?.company_name || "Empresa FORBIN";
    const companyInitials = j.companies?.company_name?.charAt(0) || "E";
    const companyLogo = j.companies?.logo_url ? "has_logo_url" : null;
    const companyUsername = j.companies?.username || null;
    const location = `${j.city || "Brasil"}, ${j.state || ""}`;
    const type = j.contract_type || "CLT";
    const shift = j.modality || "Presencial";
    const salary = (() => {
      const fmt = (n) => `R$ ${n.toLocaleString("pt-BR")}`;
      if (j.salary_min && j.salary_max) return `${fmt(j.salary_min)} – ${fmt(j.salary_max)}`;
      if (j.salary_min) return fmt(j.salary_min);
      if (j.salary_max) return fmt(j.salary_max);
      return "A combinar";
    })();
    const posted = "Recém criada";
    const applicants = j.applications?.[0]?.count || 0;
    const requirements = j.requirements ? j.requirements.split(/[\n,;]+/).map((r) => r.trim()).filter(Boolean) : [];
    const cover = j.banner_url ? "has_banner_url_base64_truncated" : "no_banner_url";

    return {
      id: j.id,
      title: j.title,
      company,
      companyInitials,
      companyLogo,
      companyUsername,
      location,
      type,
      shift,
      salary,
      posted,
      applicants,
      requirements,
      cover
    };
  });

  console.log("=== MAPPED JOBS VERIFIED ===");
  console.log(JSON.stringify(mapped, null, 2));
}
run();
