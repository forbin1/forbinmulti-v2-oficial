import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://wuarslrenynwiflzgrjp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1YXJzbHJlbnlud2lmbHpncmpwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODM0MzUxNSwiZXhwIjoyMDkzOTE5NTE1fQ.ik_1FgpXRk7L0vIigcQuJopin3592cjsicQ9aEDNvEE";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking jobs...");
  const { data, error } = await supabase.from('jobs').select('*');
  if (error) {
    console.error("Error fetching jobs:", error);
    return;
  }
  console.log(`Found ${data.length} jobs:`);
  console.log(JSON.stringify(data, null, 2));

  console.log("\nChecking companies...");
  const { data: companies, error: compError } = await supabase.from('companies').select('*');
  if (compError) {
    console.error("Error fetching companies:", compError);
    return;
  }
  console.log(`Found ${companies.length} companies:`);
  console.log(JSON.stringify(companies, null, 2));
}

run();
