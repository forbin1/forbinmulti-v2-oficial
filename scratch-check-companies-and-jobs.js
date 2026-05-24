import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wuarslrenynwiflzgrjp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1YXJzbHJlbnlud2lmbHpncmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM0MzUxNSwiZXhwIjoyMDkzOTE5NTE1fQ.ik_1FgpXRk7L0vIigcQuJopin3592cjsicQ9aEDNvEE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("=== JOBS IN DB ===");
  const { data: jobs, error: jobsError } = await supabase.from('jobs').select('id, title, company_id, is_published');
  if (jobsError) {
    console.error("Jobs error:", jobsError);
  } else {
    console.log(JSON.stringify(jobs, null, 2));
  }

  console.log("\n=== COMPANIES IN DB ===");
  const { data: companies, error: companiesError } = await supabase.from('companies').select('id, company_name, username');
  if (companiesError) {
    console.error("Companies error:", companiesError);
  } else {
    console.log(JSON.stringify(companies, null, 2));
  }
}
run();
