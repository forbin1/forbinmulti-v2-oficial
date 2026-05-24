import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wuarslrenynwiflzgrjp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1YXJzbHJlbnlud2lmbHpncmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM0MzUxNSwiZXhwIjoyMDkzOTE5NTE1fQ.ik_1FgpXRk7L0vIigcQuJopin3592cjsicQ9aEDNvEE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: jobs } = await supabase.from('jobs').select('id, title, banner_url');
  for (let j of jobs || []) {
    console.log(`Job: "${j.title}" (${j.id}) - banner_url length: ${j.banner_url ? j.banner_url.length : 0} characters`);
  }

  const { data: companies } = await supabase.from('companies').select('id, company_name, logo_url');
  for (let c of companies || []) {
    console.log(`Company: "${c.company_name}" (${c.id}) - logo_url length: ${c.logo_url ? c.logo_url.length : 0} characters`);
  }
}
run();
