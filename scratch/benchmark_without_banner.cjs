const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.time("query_without_banner");
  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, city, state, contract_type, modality, salary_min, salary_max, requirements, created_at, companies(company_name, logo_url, username), applications(count)")
    .eq("is_published", true)
    .order("created_at", { ascending: false });
  console.timeEnd("query_without_banner");

  console.log(`Returned: ${data?.length || 0} items. Error: ${error ? error.message : 'none'}`);
}

test();
