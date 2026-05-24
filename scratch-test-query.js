import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wuarslrenynwiflzgrjp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1YXJzbHJlbnlud2lmbHpncmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM0MzUxNSwiZXhwIjoyMDkzOTE5NTE1fQ.ik_1FgpXRk7L0vIigcQuJopin3592cjsicQ9aEDNvEE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== RUNNING EXACT LOADER QUERY ===");
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, city, state, contract_type, modality, salary_min, salary_max, requirements, banner_url, created_at, companies(company_name, logo_url, username), applications(count)")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Query Error:", error);
  } else {
    console.log("Query Successful! Rows returned:", data.length);
    console.log(JSON.stringify(data, null, 2));
  }
}
run();
