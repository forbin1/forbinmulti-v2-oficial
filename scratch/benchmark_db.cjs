const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Manually parse .env
let env = {};
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (let line of lines) {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        env[key] = value;
      }
    }
  }
} catch (e) {
  console.error("Error reading .env", e);
}

const supabaseUrl = env.SUPABASE_URL || process.env.SUPABASE_URL || "https://wuarslrenynwiflzgrjp.supabase.co";
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Key Present:", !!supabaseKey);

if (!supabaseKey) {
  console.error("Missing Service Role Key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.time("query_total");
  
  console.time("query_with_count");
  const { data: d1, error: e1 } = await supabase
    .from("jobs")
    .select("id, title, city, state, contract_type, modality, salary_min, salary_max, requirements, banner_url, created_at, companies(company_name, logo_url, username), applications(count)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  console.timeEnd("query_with_count");

  console.time("query_without_count");
  const { data: d2, error: e2 } = await supabase
    .from("jobs")
    .select("id, title, city, state, contract_type, modality, salary_min, salary_max, requirements, banner_url, created_at, companies(company_name, logo_url, username)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  console.timeEnd("query_without_count");

  console.log(`With count: ${d1?.length || 0} items. Error: ${e1 ? e1.message : 'none'}`);
  console.log(`Without count: ${d2?.length || 0} items. Error: ${e2 ? e2.message : 'none'}`);
  
  console.timeEnd("query_total");
}

test();
